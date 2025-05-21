## 1. General Structure and Patterns

- Use TypeScript for all source code.
- Structure code with modules, controllers, services, and providers.
- Place features in `src/modules/[feature]/` with subfolders for DTOs and entities.
- Keep controllers thin; put business logic in services.
- Use Dependency Injection for services/providers.
- Use DTOs (`*.dto.ts`) for validation and typing of request data.
- Prefer RESTful APIs and standard HTTP status codes.

**Recommended Structure:**

```
src/
  modules/
    [feature]/
      [feature].controller.ts
      [feature].service.ts
      [feature].module.ts
      dto/
      entities/
  main.ts
  app.module.ts
```

---

## 2. Naming Conventions

- **Variables & Functions:** `camelCase`
- **Classes:** `PascalCase`
- **Interfaces:** `PascalCase` (Do _not_ prefix with `I`)
- **Types:** `PascalCase`
- **Enums:** `PascalCase` (members: `PascalCase`)
- **Namespaces:** `PascalCase`
- **DTOs:** Suffix with `Dto`, e.g. `CreateUserDto`
- **Files:** `camelCase` (e.g., `user.service.ts`). Use `PascalCase` for files exporting a PascalCase class/component (e.g., `Accordion.tsx`).
- **Modules:** Suffix with `Module` (e.g., `UserModule`)

---

## 3. TypeScript Style (from style guide)

- Use `camelCase` for variables, functions, class members, and methods.
- Use `PascalCase` for class, interface, type, enum, and namespace names.
- **Interfaces:** _Do not_ prefix with `I`.
- Annotate arrays as `Type[]` instead of `Array<Type>`.
- Prefer single quotes for strings.
- Use 2 spaces for indentation (not tabs).
- Always use semicolons.
- Use `type` for unions/intersections, `interface` for extension and implementation.
- Prefer using `===` and `!==` except for `== null`/`!= null` checks for nullish values.
- Use `undefined` in general, and `null` only when required by APIs.
- Use truthy checks for objects, and `== null`/`!= null` for primitives when checking both `null`/`undefined`.

---

## 4. Formatting and Linting

- Use Prettier or IDE's built-in formatting.
- Space before type: `const foo: string = 'bar';`
- Follow the auto-formatting output unless otherwise specified.

---

## 5. Error Handling

- Throw `HttpException` (or subclasses) for HTTP errors.
- Use global exception filters for consistent error responses.

---

## 6. Environment and Configuration

- Store config in `.env` files.
- Access via NestJS `ConfigModule`.

---

## 7. Testing

- Use Jest for all tests.
- Place tests alongside source with `.spec.ts` suffix.
- Test all controllers, services, and critical logic.

---

## 8. Documentation

- Use JSDoc for all public classes and methods.
- Keep comments current and relevant.

---

## 9. Copilot Usage

- Prefer idiomatic NestJS and TypeScript patterns.
- Generate DTOs and interfaces for data validation and typing.
- Suggest companion tests for new features.
- Scaffold modules with module, controller, and service files using NestJS decorators.
- Keep controller logic minimal—delegate to services.

---

Happy coding with NestJS! 🚀

```
**References:**
- [Unofficial TypeScript Style Guide](https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md)
- [NestJS Official Docs](https://docs.nestjs.com/)
```
