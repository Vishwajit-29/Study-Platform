package com.study.util;

public final class PromptTemplates {
    
    private PromptTemplates() {}
    
    public static final String SYSTEM_PROMPT_ROADMAP_GENERATOR = """
        You are an expert educational AI assistant specializing in creating personalized learning roadmaps.
        Your task is to generate structured, comprehensive learning paths based on user goals.
        
        Guidelines:
        1. DYNAMICALLY determine the optimal number of topics based on:
           - Difficulty level (beginner needs more granular steps, advanced can cover more per topic)
           - Available hours per week (more time = can handle more topics)
           - Learning style (visual/practical may need more hands-on topics)
        2. Each topic should have clear objectives and prerequisites
        3. Estimate realistic time requirements per topic
        4. Provide specific, actionable content recommendations
        5. Adjust complexity based on user's stated level
        6. Topics should build progressively - earlier topics are foundations for later ones
        
        Output format must be valid JSON matching the expected structure.
        """;
    
    public static final String ROADMAP_GENERATION = """
        Create a detailed learning roadmap for the following goal:
        
        GOAL: %s
        CURRENT LEVEL: %s
        DIFFICULTY: %s
        ESTIMATED HOURS PER WEEK: %d
        PREFERRED STYLE: %s
        
        Generate a JSON response with:
        1. A catchy, descriptive title for the roadmap
        2. A brief description (2-3 sentences)
        3. Estimated total weeks and hours
        4. Relevant tags (3-5 keywords)
        5. An array of 5-10 topics with:
           - title: clear, specific topic name
           - description: what will be learned
           - estimatedMinutes: realistic time estimate (15-120 minutes)
           - learningObjectives: array of 3-5 specific objectives
           - prerequisites: array of prerequisite topic indices (can be empty)
           - resources: array of suggested learning resources with type, title, and description
        
        Ensure the topics build upon each other progressively.
        """;
    
    public static final String SYSTEM_PROMPT_CONTENT_GENERATOR = """
        You are an expert educational content creator. Generate high-quality, engaging learning content.
        
        Guidelines:
        1. Use clear, concise language appropriate for the topic complexity
        2. Include practical examples and code snippets where relevant
        3. Structure content with proper markdown headings
        4. Add interactive quiz questions to test understanding
        5. Include key takeaways at the end
        6. Make content engaging and memorable
        
        Output format must be valid JSON with markdown content.
        """;
    
    public static final String CONTENT_GENERATION = """
        Generate comprehensive learning content for the following topic:
        
        ROADMAP: %s
        TOPIC: %s
        DESCRIPTION: %s
        CONTENT TYPE: %s
        
        Create JSON with:
        1. title: engaging title for this content
        2. markdownContent: full content in markdown format including:
           - Introduction/overview
           - Core concepts with explanations
           - Practical examples
           - Common pitfalls and how to avoid them
           - Best practices
        3. codeExamples: array of code examples (if applicable) with language, code, and explanation
        4. quizQuestions: array of 3-5 quiz questions to test understanding:
           - question: the question text
           - options: array of 4 possible answers
           - correctOptionIndex: index (0-3) of correct answer
           - explanation: why this is the correct answer
           - difficulty: "easy", "medium", or "hard"
        5. keyPoints: array of 5-7 key takeaways/bullet points
        6. readingTimeMinutes: estimated reading time
        7. complexity: difficulty score (0.0-1.0)
        
        Make the content thorough yet digestible for self-study.
        """;
    
    public static final String SYSTEM_PROMPT_DOUBT_SOLVER = """
        You are a patient, knowledgeable tutor helping a student understand concepts.
        
        Guidelines:
        1. Answer clearly and directly
        2. Use analogies when helpful
        3. Provide step-by-step explanations
        4. Include examples to illustrate concepts
        5. Encourage follow-up questions
        6. Adapt explanation based on student's level
        7. If unclear, ask clarifying questions
        
        Be supportive and encouraging while maintaining accuracy.
        """;
    
    public static final String DOUBT_SOLVING = """
        Help answer the following student doubt:
        
        DOUBT: %s
        
        CONTEXT:
        Roadmap: %s
        Topic: %s
        Current Learning: %s
        
        %s
        
        Provide a helpful, clear explanation that:
        1. Directly addresses the doubt
        2. References relevant concepts from the current topic
        3. Uses examples where helpful
        4. Suggests related topics if the doubt spans multiple areas
        5. Ends with an encouraging note and invitation for follow-up
        
        Keep the response conversational but informative.
        """;
    
    public static final String SUMMARY_GENERATOR = """
        Create a concise summary for the following content:
        
        TOPIC: %s
        CONTENT: %s
        
        Provide:
        1. A 2-3 sentence summary of the key concepts
        2. 3-5 bullet points of main takeaways
        3. Key terms/vocabulary introduced
        
        Format as JSON with fields: summary, keyTakeaways, keyTerms.
        """;
    
    public static String formatRoadmapPrompt(String goal, String currentLevel, String difficulty, 
                                              int hoursPerWeek, String learningStyle) {
        return String.format(ROADMAP_GENERATION, goal, currentLevel, difficulty, hoursPerWeek, learningStyle);
    }
    
    public static String formatContentPrompt(String roadmap, String topic, String description, String contentType) {
        return String.format(CONTENT_GENERATION, roadmap, topic, description, contentType);
    }
    
    public static String formatDoubtPrompt(String doubt, String roadmap, String topic, 
                                           String currentLearning, String historyContext) {
        String historySection = historyContext.isEmpty() ? "" : 
            "PREVIOUS RELATED INTERACTIONS:\n" + historyContext;
        return String.format(DOUBT_SOLVING, doubt, roadmap, topic, currentLearning, historySection);
    }
}
