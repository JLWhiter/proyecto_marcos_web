package com.repuestos.solutions.auth.dto;

import java.util.Map;

public record LoginResponse(String token, Map<String, Object> usuario) {
}
