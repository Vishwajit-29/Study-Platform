package com.study.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
    
    @Override
    public void commence(HttpServletRequest request,
                        HttpServletResponse response,
                        AuthenticationException authException) throws IOException, ServletException {
        // For SSE/streaming endpoints the response may already be committed
        // (headers + partial body already sent). Calling sendError on a committed
        // response triggers "Cannot render error page for request [null] as the
        // response has already been committed" which corrupts the async context
        // and leaks Tomcat threads, eventually crashing the whole backend.
        if (response.isCommitted()) {
            log.warn("Response already committed — cannot send 401 for URI: {}",
                    request != null ? request.getRequestURI() : "null");
            return;
        }
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, authException.getMessage());
    }
}
