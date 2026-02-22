package com.study.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.study.dto.AIRequest;
import com.study.dto.AIResponse;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class NvidiaAIService {

    private WebClient webClient;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    
    @Value("${nvidia.api.key:}")
    private String apiKey;
    
    @Value("${nvidia.api.base-url:https://integrate.api.nvidia.com/v1}")
    private String baseUrl;
    
    @Value("${nvidia.api.model:z-ai/glm5}")
    private String defaultModel;
    
    @Value("${nvidia.api.timeout:120}")
    private int timeoutSeconds;

    public NvidiaAIService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClientBuilder = webClientBuilder;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        log.info("=== NVIDIA AI Service Initialization ===");
        log.info("Base URL: {}", baseUrl);
        log.info("API Key configured: {}", (apiKey != null && !apiKey.isEmpty()) ? "YES (length=" + apiKey.length() + ")" : "NO - AI features disabled");
        log.info("Model: {}", defaultModel);
        log.info("Timeout: {}s", timeoutSeconds);
        
        // Configure HttpClient with proper timeouts for long-running AI requests
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30_000)
                .responseTimeout(Duration.ofSeconds(timeoutSeconds))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(timeoutSeconds, TimeUnit.SECONDS)));
        
        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
        
        if (!isAvailable()) {
            log.warn("NVIDIA AI service is NOT available - API key is missing or empty!");
        } else {
            log.info("NVIDIA AI service initialized successfully.");
        }
        log.info("=========================================");
    }

    /**
     * Generate content using NVIDIA AI with a simple prompt
     */
    public AIResponse generate(String prompt) {
        return generate(AIRequest.withPrompt(prompt));
    }

    /**
     * Generate content using NVIDIA AI with full request configuration
     */
    public AIResponse generate(AIRequest request) {
        long startTime = System.currentTimeMillis();
        
        if (!isAvailable()) {
            log.warn("AI generate called but service is not available (no API key)");
            return AIResponse.error("NVIDIA AI service is not configured - API key is missing");
        }
        
        try {
            ObjectNode requestBody = buildRequestBody(request);
            log.info("Calling NVIDIA API: model={}, messages={}", 
                    requestBody.get("model"), 
                    requestBody.get("messages") != null ? requestBody.get("messages").size() + " messages" : "none");
            
            String response = webClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .retryWhen(Retry.backoff(2, Duration.ofSeconds(2))
                            .filter(ex -> !(ex instanceof WebClientResponseException.Unauthorized))
                            .doBeforeRetry(signal -> log.warn("Retrying NVIDIA API call (attempt {}): {}",
                                    signal.totalRetries() + 1, signal.failure().getMessage())))
                    .block();
            
            long responseTime = System.currentTimeMillis() - startTime;
            log.info("NVIDIA API response received in {}ms, length={}", responseTime, 
                    response != null ? response.length() : 0);
            
            return parseResponse(response, responseTime);
            
        } catch (WebClientResponseException e) {
            log.error("NVIDIA API error: Status={}, Body={}", e.getStatusCode(), e.getResponseBodyAsString());
            return AIResponse.error("AI service error: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error calling NVIDIA AI service: {}", e.getMessage(), e);
            return AIResponse.error("Failed to generate content: " + e.getMessage());
        }
    }

    /**
     * Stream content generation for real-time responses
     */
    public Flux<String> generateStream(AIRequest request) {
        ObjectNode requestBody = buildRequestBody(request);
        requestBody.put("stream", true);
        
        return webClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(String.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .onErrorResume(e -> {
                    log.error("Streaming error", e);
                    return Flux.just("Error: " + e.getMessage());
                });
    }

    /**
     * Generate content with system prompt for better context
     */
    public AIResponse generateWithSystem(String systemPrompt, String userPrompt) {
        return generate(AIRequest.withSystemPrompt(systemPrompt, userPrompt));
    }

    /**
     * Parse raw JSON response into AIResponse object
     */
    private AIResponse parseResponse(String responseBody, long responseTime) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            
            JsonNode choices = root.get("choices");
            if (choices == null || !choices.isArray() || choices.size() == 0) {
                return AIResponse.error("No choices in AI response");
            }
            
            JsonNode firstChoice = choices.get(0);
            JsonNode message = firstChoice.get("message");
            String content = message != null ? message.get("content").asText() : "";
            
            JsonNode usage = root.get("usage");
            int promptTokens = usage != null && usage.has("prompt_tokens") ? 
                    usage.get("prompt_tokens").asInt() : 0;
            int completionTokens = usage != null && usage.has("completion_tokens") ? 
                    usage.get("completion_tokens").asInt() : 0;
            int totalTokens = usage != null && usage.has("total_tokens") ? 
                    usage.get("total_tokens").asInt() : 0;
            
            return AIResponse.builder()
                    .success(true)
                    .content(content)
                    .model(root.get("model") != null ? root.get("model").asText() : defaultModel)
                    .promptTokens(promptTokens)
                    .completionTokens(completionTokens)
                    .totalTokens(totalTokens)
                    .responseTimeMs(responseTime)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error parsing AI response", e);
            return AIResponse.error("Failed to parse AI response: " + e.getMessage());
        }
    }

    /**
     * Build request body for NVIDIA API
     */
    private ObjectNode buildRequestBody(AIRequest request) {
        ObjectNode requestBody = objectMapper.createObjectNode();
        
        // Use specified model or default
        requestBody.put("model", request.getModel() != null ? request.getModel() : defaultModel);
        
        // Build messages array
        ArrayNode messages = objectMapper.createArrayNode();
        
        if (request.getMessages() != null && !request.getMessages().isEmpty()) {
            // Use provided messages
            for (AIRequest.Message msg : request.getMessages()) {
                ObjectNode messageNode = objectMapper.createObjectNode();
                messageNode.put("role", msg.getRole());
                messageNode.put("content", msg.getContent());
                messages.add(messageNode);
            }
        } else if (request.getSystemPrompt() != null && !request.getSystemPrompt().isEmpty()) {
            // Use system + user prompt
            ObjectNode systemMessage = objectMapper.createObjectNode();
            systemMessage.put("role", "system");
            systemMessage.put("content", request.getSystemPrompt());
            messages.add(systemMessage);
            
            ObjectNode userMessage = objectMapper.createObjectNode();
            userMessage.put("role", "user");
            userMessage.put("content", request.getPrompt());
            messages.add(userMessage);
        } else {
            // Simple user prompt only
            ObjectNode userMessage = objectMapper.createObjectNode();
            userMessage.put("role", "user");
            userMessage.put("content", request.getPrompt());
            messages.add(userMessage);
        }
        
        requestBody.set("messages", messages);
        requestBody.put("temperature", request.getTemperature());
        requestBody.put("max_tokens", request.getMaxTokens());
        requestBody.put("stream", request.isStream());
        
        return requestBody;
    }

    /**
     * Check if NVIDIA AI service is properly configured and available
     */
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isEmpty() && !apiKey.equals("your-nvidia-api-key-here");
    }

    /**
     * Extract JSON from AI response (in case there's markdown or other text)
     */
    public String extractJsonFromResponse(String content) {
        if (content == null || content.isEmpty()) {
            return "{}";
        }
        
        // Try to find JSON between markdown code blocks
        int jsonStart = content.indexOf("```json");
        if (jsonStart != -1) {
            int jsonEnd = content.indexOf("```", jsonStart + 7);
            if (jsonEnd != -1) {
                return content.substring(jsonStart + 7, jsonEnd).trim();
            }
        }
        
        // Try to find JSON between generic code blocks
        jsonStart = content.indexOf("```");
        if (jsonStart != -1) {
            int jsonEnd = content.indexOf("```", jsonStart + 3);
            if (jsonEnd != -1) {
                String potentialJson = content.substring(jsonStart + 3, jsonEnd).trim();
                if (potentialJson.startsWith("{") || potentialJson.startsWith("[")) {
                    return potentialJson;
                }
            }
        }
        
        // Try to find JSON between curly braces
        jsonStart = content.indexOf("{");
        int jsonEnd = content.lastIndexOf("}");
        if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
            return content.substring(jsonStart, jsonEnd + 1);
        }
        
        return content;
    }
}
