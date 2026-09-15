package com.repuestos.solutions.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Helper para acceder al usuario autenticado desde los controllers.
 */
public final class SecurityUtil {

    private SecurityUtil() {
    }

    public static AppUser.AuthPrincipal current() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AppUser.AuthPrincipal p) {
            return p;
        }
        throw new org.springframework.security.access.AccessDeniedException("No autenticado");
    }

    public static Integer currentUserId() {
        return current().id();
    }

    public static boolean hasAnyRole(Integer... allowedRoleIds) {
        try {
            Integer rolId = current().rolId();
            for (Integer id : allowedRoleIds) {
                if (id.equals(rolId)) {
                    return true;
                }
            }
        } catch (Exception e) {
            return false;
        }
        return false;
    }
}
