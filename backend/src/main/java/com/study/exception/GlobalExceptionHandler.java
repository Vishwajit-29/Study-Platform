package com.study.exception;

import com.study.dto.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Catch IOExceptions caused by client disconnecting during SSE streaming
     * (e.g. "Broken pipe", "Connection reset"). There is nothing useful we can
     * send — the client is gone — so just log and swallow.
     * Without this handler the exception propagates to the default error page
     * renderer which then fails with "Cannot render error page for request [null]
     * as the response has already been committed", corrupting the async context
     * and leaking Tomcat threads until the backend becomes unresponsive.
     */
    @ExceptionHandler(IOException.class)
    public ResponseEntity<Void> handleIOException(IOException ex, HttpServletResponse response) {
        String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
        if (response.isCommitted() || msg.contains("broken pipe") || msg.contains("connection reset")) {
            log.debug("Client disconnected during async/SSE request: {}", ex.getMessage());
            return null; // nothing to return — the connection is gone
        }
        log.error("IO error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }

    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ApiResponse> handleRuntimeException(RuntimeException ex,
                                                               HttpServletResponse response) {
        if (response.isCommitted()) {
            log.warn("Cannot send error response — response already committed: {}", ex.getMessage());
            return null;
        }
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<ApiResponse> handleAuthenticationException(AuthenticationException ex,
                                                                      HttpServletResponse response) {
        if (response.isCommitted()) {
            log.warn("Cannot send auth error — response already committed: {}", ex.getMessage());
            return null;
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Authentication failed: " + ex.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.badRequest().body(errors);
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ApiResponse> handleGlobalException(Exception ex,
                                                              HttpServletResponse response) {
        if (response.isCommitted()) {
            log.warn("Cannot send 500 error — response already committed: {}", ex.getMessage());
            return null;
        }
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred: " + ex.getMessage()));
    }
}
