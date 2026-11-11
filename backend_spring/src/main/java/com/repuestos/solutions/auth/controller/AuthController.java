package com.repuestos.solutions.auth.controller;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.repuestos.solutions.auth.dto.LoginRequest;
import com.repuestos.solutions.auth.service.AuthService;
import com.repuestos.solutions.common.ApiResponse;
import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.security.AppUser;
import com.repuestos.solutions.security.SecurityUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Réplica de routes/auth.py + AuthController (Flask): /api/v1/auth.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String UPLOAD_DIR = "./uploads/fotos";
    private static final String AUTH_COOKIE = "trucks_token";

    private final AuthService authService;

    @Value("${app.jwt.expiration-hours}")
    private long expirationHours;

    @Value("${app.auth.cookie-secure:false}")
    private boolean secureCookie;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest body) {
        body.setUsuario(body.getUsuario() == null ? "" : body.getUsuario().trim());
        Map<String, Object> result = authService.login(body.getUsuario(), body.getContrasena());
        String token = (String) result.remove("token");
        ResponseCookie cookie = ResponseCookie.from(AUTH_COOKIE, token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofHours(expirationHours))
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(result, "Inicio de sesión exitoso").getBody());
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletRequest request) {
        String token = tokenFrom(request);
        authService.logout(token, SecurityUtil.current().id());
        ResponseCookie cookie = ResponseCookie.from(AUTH_COOKIE, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success("Sesión cerrada").getBody());
    }

    private String tokenFrom(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (AUTH_COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return "";
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me() {
        AppUser.AuthPrincipal p = SecurityUtil.current();
        Map<String, Object> user = authService.me(p.id());
        if (user == null) {
            return ApiResponse.error("Usuario no encontrado", HttpStatus.NOT_FOUND);
        }
        return ApiResponse.success(user, "Usuario autenticado");
    }

    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> actualizarPerfil(@RequestBody Map<String, Object> body) {
        Map<String, Object> data = new LinkedHashMap<>();
        for (String k : new String[]{"nombre", "apellidos", "celular", "dni", "foto"}) {
            if (body.containsKey(k) && body.get(k) != null) {
                data.put(k, body.get(k));
            }
        }
        if (data.isEmpty()) {
            return ApiResponse.error("No hay campos para actualizar");
        }
        Map<String, Object> result = authService.actualizarPerfil(SecurityUtil.current().id(), data);
        if (result == null) {
            return ApiResponse.error("Usuario no encontrado", HttpStatus.NOT_FOUND);
        }
        return ApiResponse.success(result, "Perfil actualizado");
    }

    @PostMapping("/me/foto")
    public ResponseEntity<Map<String, Object>> subirFoto(HttpServletRequest request,
                                                         @RequestParam("file") MultipartFile file) {
        if (file == null || file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
            return ApiResponse.error("No se recibió ningún archivo");
        }
        String name = file.getOriginalFilename();
        int dot = name.lastIndexOf('.');
        String ext = dot < 0 ? "" : name.substring(dot).toLowerCase();
        if (!(ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".png"))) {
            return ApiResponse.error("Formato no permitido. Use JPG o PNG");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            return ApiResponse.error("El archivo supera los 5MB");
        }
        int userId = SecurityUtil.current().id();
        try (InputStream in = file.getInputStream()) {
            Path dir = Paths.get(UPLOAD_DIR);
            Files.createDirectories(dir);
            Path target = dir.resolve(userId + "_" + UUID.randomUUID().toString().substring(0, 8) + ext);
            Files.copy(in, target);
            String url = "/uploads/fotos/" + target.getFileName();
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("foto", url);
            authService.actualizarPerfil(userId, data);
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("foto", url);
            return ApiResponse.success(resp, "Foto actualizada", HttpStatus.CREATED);
        } catch (IOException e) {
            throw new BusinessException("Error al guardar la foto");
        }
    }
}
