# 1. System Context  
Technical purpose is to develop an AI-driven bot for managing repetitive tasks in online games. Ubiquitous Language: `OpenKore`.

# 2. Architectural Patterns  
Architecture Style: Modular Monolith

Layer Coupling Rules and Isolation Boundaries:
- Presentation Layer (`src/ui`): Responsible for the user interface.
- Business Logic Layer (`src/logic`): Contains game-specific logic, AI algorithms, etc., isolated from external dependencies.
- Data Access Layer (`src/data`): Handles database interactions.

# 3. Stack & Libraries  
Primary Technologies and Implementation Preferences:
- Use `bun` over Node.js for server-side execution due to performance benefits.
- Prefer functional components in the UI layer.
- Use TypeScript with strict type checking.
- Utilize `turbo` for efficient build and run commands.

# 4. Anti-Patterns (What NOT to do)  
Hard Restrictions:
- Never mix domain logic with HTTP handlers.
- Do not bypass type checks or use any non-TypeScript code in the business logic layer.

# 5. AI Conduct Rules  
How the Model Must Behave When Working on This Project:
- Return only code requested, no explanations.
- Do not explain the obvious.
- Maintain strong typing at all times.