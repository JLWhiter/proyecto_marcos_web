package com.repuestos.solutions.auth.controller;

import com.repuestos.solutions.auth.dto.LoginRequest;
import com.repuestos.solutions.auth.service.AuthService;
import com.repuestos.solutions.common.ApiResponse;
import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.security.AppUser;
import com.repuestos.solutions.security.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Réplica de routes/auth.py + AuthController (Flask): /api/v1/auth.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String UPLOAD_DIR = "./uploads/fotos";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest body) {
        body.setUsuario(body.getUsuario() == null ? "" : body.getUsuario().trim());
        Map<String, Object> result = authService.login(body.getUsuario(), body.getContrasena());
        return ApiResponse.success(result, "Inicio de sesión exitoso");
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = header != null && header.startsWith("Bearer ")
                ? header.substring(7).trim() : "";
        authService.logout(token, SecurityUtil.current().id());
        return ApiResponse.success("Sesión cerrada");
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
