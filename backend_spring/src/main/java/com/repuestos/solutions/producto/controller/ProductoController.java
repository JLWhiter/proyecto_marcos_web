package com.repuestos.solutions.producto.controller;

import com.repuestos.solutions.common.ApiResponse;
import com.repuestos.solutions.common.BusinessException;
import com.repuestos.solutions.producto.service.ProductoService;
import com.repuestos.solutions.security.SecurityUtil;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/productos")
public class ProductoController {

    private static final int MAX_NOMBRE = 50;
    private static final int MAX_CODIGO = 10;

    private final ProductoService service;
    private final JdbcTemplate jdbc;

    public ProductoController(ProductoService service, JdbcTemplate jdbc) {
        this.service = service;
        this.jdbc = jdbc;
    }

    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(defaultValue = "1") int page,
                                    @RequestParam(defaultValue = "20") int perPage,
                                    @RequestParam(required = false) String q,
                                    @RequestParam(required = false) Integer idMarca,
                                    @RequestParam(required = false) Integer idCategoria) {
        perPage = clampPerPage(perPage);
        Map<String, Object> result = service.listar(q, idMarca, idCategoria, page, perPage);
        return ApiResponse.paginated((List<?>) result.get("items"), ((Number) result.get("total")).longValue(),
                page, perPage, "Productos obtenidos");
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable int id) {
        Map<String, Object> data = service.obtener(id);
        if (data == null) {
            return ApiResponse.error("Producto no encontrado", HttpStatus.NOT_FOUND);
        }
        return ApiResponse.success(data, "Producto obtenido");
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body) {
        ResponseEntity<?> forbidden = requireSupervisorOrAdmin();
        if (forbidden != null) {
            return forbidden;
        }
        String error = validarProductoBody(body, false);
        if (error != null) {
            return ApiResponse.error(error, HttpStatus.BAD_REQUEST);
        }
        if (str(body.get("nombre")).length() > MAX_NOMBRE
                || String.valueOf(body.get("codigo")).length() > MAX_CODIGO) {
            return ApiResponse.error("nombre (" + MAX_NOMBRE + ") o codigo (" + MAX_CODIGO + ") excede el límite",
                    HttpStatus.BAD_REQUEST);
        }
        try {
            Map<String, Object> data = service.crear(body, SecurityUtil.currentUserId());
            return ApiResponse.success(data, "Producto creado", HttpStatus.CREATED);
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/registrar")
    public ResponseEntity<?> registrar(@RequestBody Map<String, Object> body) {
        ResponseEntity<?> forbidden = requireSupervisorOrAdmin();
        if (forbidden != null) {
            return forbidden;
        }
        List<String> missing = new ArrayList<>();
        for (String f : List.of("nombre", "codigo")) {
            Object v = body.get(f);
            if (v == null || String.valueOf(v).isBlank()) {
                missing.add(f);
            }
        }
        if (!missing.isEmpty()) {
            return ApiResponse.error("Campos requeridos: " + String.join(", ", missing), HttpStatus.BAD_REQUEST);
        }
        String error = validarProductoBody(body, true);
        if (error != null) {
            return ApiResponse.error(error, HttpStatus.BAD_REQUEST);
        }
        if (body.containsKey("stock_actual")) {
            Integer n = toInt(body.get("stock_actual"), "stock_actual", 0);
            if (n == null) {
                return ApiResponse.error("stock_actual debe ser un número entero", HttpStatus.BAD_REQUEST);
            }
            body.put("stock_actual", n);
        }
        if (body.containsKey("stock_minimo")) {
            Integer n = toInt(body.get("stock_minimo"), "stock_minimo", 0);
            if (n == null) {
                return ApiResponse.error("stock_minimo debe ser un número entero", HttpStatus.BAD_REQUEST);
            }
            body.put("stock_minimo", n);
        }
        if (body.get("id_estado_producto") != null) {
            Integer n = toInt(body.get("id_estado_producto"), "id_estado_producto", 1);
            if (n == null) {
                return ApiResponse.error("id_estado_producto debe ser un número entero", HttpStatus.BAD_REQUEST);
            }
            body.put("id_estado_producto", n);
        }
        if (body.containsKey("ubicacion") && body.get("ubicacion") != null) {
            String u = String.valueOf(body.get("ubicacion"));
            if (u.length() > 50) {
                return ApiResponse.error("ubicacion no puede superar 50 caracteres", HttpStatus.BAD_REQUEST);
            }
        }
        try {
            Map<String, Object> data = service.registrarCompleto(body, SecurityUtil.currentUserId());
            return ApiResponse.success(data, "Producto registrado con inventario", HttpStatus.CREATED);
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable int id, @RequestBody Map<String, Object> body) {
        ResponseEntity<?> forbidden = requireAdminOrPriceEditor();
        if (forbidden != null) {
            return forbidden;
        }
        if (body == null || body.isEmpty()) {
            return ApiResponse.error("No hay datos para actualizar", HttpStatus.BAD_REQUEST);
        }
        String error = validarProductoBody(body, true);
        if (error != null) {
            return ApiResponse.error(error, HttpStatus.BAD_REQUEST);
        }
        try {
            service.actualizar(id, body, SecurityUtil.currentUserId());
            return ApiResponse.success(null, "Producto actualizado");
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable int id) {
        ResponseEntity<?> forbidden = requireCanDelete();
        if (forbidden != null) {
            return forbidden;
        }
        boolean ok;
        try {
            ok = service.eliminar(id, SecurityUtil.currentUserId());
        } catch (BusinessException e) {
            return ApiResponse.error(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (DataIntegrityViolationException e) {
            return ApiResponse.error("No se puede eliminar el producto: tiene inventario u otros datos asociados",
                    HttpStatus.CONFLICT);
        }
        if (!ok) {
            return ApiResponse.error("Producto no encontrado", HttpStatus.NOT_FOUND);
        }
        return ApiResponse.success(null, "Producto eliminado");
    }

    @PostMapping("/{id}/imagen")
    public ResponseEntity<?> subirImagen(@PathVariable int id, @RequestParam("file") MultipartFile file) {
        ResponseEntity<?> forbidden = requireSupervisorOrAdmin();
        if (forbidden != null) {
            return forbidden;
        }
        if (file == null || file.isEmpty() || file.getOriginalFilename() == null) {
            return ApiResponse.error("No se recibió ningún archivo", HttpStatus.BAD_REQUEST);
        }
        String name = file.getOriginalFilename();
        int dot = name.lastIndexOf('.');
        String ext = (dot >= 0 ? name.substring(dot) : "").toLowerCase();
        if (!List.of(".jpg", ".jpeg", ".png", ".webp").contains(ext)) {
            return ApiResponse.error("Formato no permitido. Use JPG, PNG o WebP", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            return ApiResponse.error("El archivo supera los 5MB", HttpStatus.BAD_REQUEST);
        }
        try {
            Path uploadDir = Paths.get(uploadRoot(), "uploads", "productos");
            Files.createDirectories(uploadDir);
            String storedName = UUID.randomUUID().toString().replace("-", "") + ext;
            Files.copy(file.getInputStream(), uploadDir.resolve(storedName));
            String url = "/uploads/productos/" + storedName;
            Map<String, Object> data = service.actualizarCampo(id, "imagen_url", url);
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("url", url);
            resp.put("imagen_url", url);
            return ApiResponse.success(resp, "Imagen del producto actualizada", HttpStatus.CREATED);
        } catch (Exception e) {
            return ApiResponse.error("Error al subir la imagen: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String validarProductoBody(Map<String, Object> body, boolean parcial) {
        if (!parcial) {
            for (String f : List.of("nombre", "codigo", "precio_compra", "precio_venta")) {
                if (body.get(f) == null || String.valueOf(body.get(f)).isBlank()) {
                    return "Campo requerido: " + f;
                }
            }
        }
        for (String campo : List.of("nombre", "codigo")) {
            if (body.containsKey(campo)) {
                String v = str(body.get(campo));
                int max = campo.equals("nombre") ? MAX_NOMBRE : MAX_CODIGO;
                if (v.length() > max) {
                    return campo + " no puede superar " + max + " caracteres";
                }
            }
        }
        for (String campo : List.of("precio_compra", "precio_venta", "utilidad")) {
            if (body.containsKey(campo) && body.get(campo) != null) {
                BigDecimal d = toDecimal(body.get(campo), campo);
                if (d == null) {
                    return campo + " debe ser un número";
                }
                if (d.compareTo(BigDecimal.ZERO) < 0) {
                    return campo + " debe ser mayor o igual a 0";
                }
            }
        }
        for (String campo : List.of("id_marca", "id_categoria")) {
            if (body.containsKey(campo) && body.get(campo) != null) {
                Integer n = toPositiveInt(body.get(campo), campo);
                if (n == null) {
                    return campo + " debe ser un número entero";
                }
                body.put(campo, n);
            }
        }
        Object proveedores = body.get("id_proveedores");
        if (proveedores != null && !(proveedores instanceof List) && !(proveedores instanceof Integer)
                && !(String.valueOf(proveedores).trim().startsWith("["))) {
            return "id_proveedores debe ser una lista de ids";
        }
        Object marcas = body.get("id_marcas");
        if (marcas != null) {
            if (!(marcas instanceof List)) {
                return "id_marcas debe ser una lista de ids numéricos";
            }
            for (Object m : (List<?>) marcas) {
                if (!(m instanceof Integer) || m instanceof Boolean || (Integer) m < 1) {
                    return "id_marcas debe ser una lista de ids numéricos (mayores a 0)";
                }
            }
        }
        return null;
    }

    private static int clampPerPage(int value) {
        if (value < 1) {
            return 20;
        }
        return Math.min(value, 100);
    }

    private ResponseEntity<?> requireSupervisorOrAdmin() {
        if (!SecurityUtil.hasAnyRole(1, 2, 3)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        return null;
    }

    private ResponseEntity<?> requireCanDelete() {
        if (!SecurityUtil.hasAnyRole(1, 2)) {
            return ApiResponse.error("Acceso denegado.", HttpStatus.FORBIDDEN);
        }
        return null;
    }

    private ResponseEntity<?> requireAdminOrPriceEditor() {
        if (SecurityUtil.hasAnyRole(1)) {
            return null;
        }
        List<String> rows = jdbc.queryForList(
                "SELECT privilegio FROM usuario WHERE id = ? AND activo = 1",
                String.class, SecurityUtil.currentUserId());
        if (!rows.isEmpty() && "editar_precio".equals(rows.get(0))) {
            return null;
        }
        return ApiResponse.error("Acceso denegado. Se requiere privilegio de edición de precio.",
                HttpStatus.FORBIDDEN);
    }

    private static String str(Object v) {
        return v == null ? "" : String.valueOf(v);
    }

    private static Integer toInt(Object v, String name, int min) {
        Integer n = toPositiveInt(v, name);
        return n != null && n >= min ? n : (n != null ? n : null);
    }

    private static Integer toPositiveInt(Object v, String name) {
        try {
            if (v instanceof Boolean) {
                return null;
            }
            return Integer.valueOf(String.valueOf(v).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static BigDecimal toDecimal(Object v, String name) {
        try {
            if (v instanceof Boolean) {
                return null;
            }
            return new BigDecimal(String.valueOf(v));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String uploadRoot() {
        String dir = System.getProperty("user.dir");
        return java.nio.file.Paths.get(dir).toAbsolutePath().toString();
    }
}
