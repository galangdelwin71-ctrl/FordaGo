# Programming Languages Study Module for fordaGo

## Purpose
This study module helps you learn the main programming languages and technologies used in the fordaGo project without changing the system code.

## What this system uses
- **TypeScript**: the main language for the Ionic/Angular frontend.
- **HTML**: the web markup for UI pages and templates.
- **SCSS/CSS**: styles for the app's appearance.
- **JavaScript / Node.js**: the backend server is built with Node.js using JavaScript.
- **SQL**: database schema and queries for MySQL.
- **JSON**: configuration and package metadata files.

## 1. TypeScript + Angular + Ionic
### Why it's used
The app frontend is written in TypeScript for type safety, using Angular for structure and Ionic for mobile-friendly UI.

### Key concepts
- **Components**: reusable UI pieces with a `.ts`, `.html`, and `.scss` file.
- **Services**: shared logic for API calls, data handling, and state.
- **Routing**: navigation between pages handled by Angular routes.
- **Modules**: feature grouping and imports.

### Example topic list
1. TypeScript types: `string`, `number`, `boolean`, arrays, interfaces.
2. Classes and constructors.
3. Angular decorators: `@Component`, `@NgModule`, `@Injectable`.
4. Template binding: `{{ value }}`, `[property]`, `(event)`.
5. Dependency injection: using services inside components.
6. Observables and async data with RxJS.
7. Ionic UI components: `ion-button`, `ion-list`, `ion-card`, `ion-input`.

### Practice tasks
- Open a page file under `src/app` and identify the `.ts`, `.html`, and `.scss` files.
- Find one service and trace where it is injected into a component.
- Create a small example in a separate note: a TypeScript class with an interface and a method.

## 2. HTML
### Why it's used
HTML defines the structure of the pages and how the content appears in the app.

### Key concepts
- Tags like `<div>`, `<button>`, `<ion-header>`, `<ion-content>`.
- Attributes such as `class`, `id`, `href`, and Angular bindings.
- Hierarchy and nested elements.

### Practice tasks
- Read one page template in `src/app/pages` or `src/app` and identify the main sections.
- Locate Angular bindings like `*ngFor`, `*ngIf`, `(click)`, and `[(ngModel)]`.

## 3. SCSS / CSS
### Why it's used
SCSS styles make the app look polished and responsive.

### Key concepts
- Selectors: `.class`, `#id`, element selectors.
- Nesting in SCSS.
- Variables and mixins.
- Layout styling with flexbox or grid.

### Practice tasks
- Open a page stylesheet and find a nested selector.
- Note how Ionic CSS classes are used with custom classes.

## 4. JavaScript / Node.js / Express backend
### Why it's used
The backend uses Node.js and JavaScript to run the server, handle requests, and connect to the database.

### Key concepts
- `require()` imports modules.
- Express routing: `app.get()`, `app.post()`, `app.use()`.
- Middleware: body parsing, CORS, authentication.
- Environment variables loaded by `dotenv`.
- Starting the server with `node index.js`.

### Practice tasks
- Open `server/index.js` and identify the routes and middleware.
- Open `server/db.js` and see how the database connection is created.
- Note the `server/package.json` dependencies.

## 5. SQL / MySQL
### Why it's used
SQL stores app data like users, equipment, transactions, and reports.

### Key concepts
- Tables and columns.
- `CREATE TABLE`, `INSERT`, `SELECT`, `UPDATE`, `DELETE`.
- Primary keys and foreign keys.
- SQL schema defined in `server/fordago_schema.sql`.

### Practice tasks
- Open `server/fordago_schema.sql` and review the table definitions.
- Look for column types like `INT`, `VARCHAR`, `DATETIME`.

## 6. JSON configuration files
### Why it's used
JSON files define app settings, dependencies, and build behavior.

### Key concepts
- `package.json`: scripts, dependencies, devDependencies.
- `angular.json`: Angular workspace configuration.
- `tsconfig.json`: TypeScript compiler settings.

### Practice tasks
- Open the root `package.json` and notice the `scripts` section.
- Compare `server/package.json` with the root package file.

## Study plan
1. Start with the frontend: TypeScript and Angular basics.
2. Practice HTML templates and SCSS styling.
3. Read the backend files and understand Express routes.
4. Review the SQL schema to see how data is stored.
5. Use the JSON files to connect the tools and scripts.

## Tips for learning
- Take notes on one file at a time.
- Write short examples in a separate file to test syntax.
- Use the browser dev tools and Node terminal to reinforce how the app runs.

## Extra resources
- TypeScript: https://www.typescriptlang.org/docs/
- Angular: https://angular.io/docs
- Ionic: https://ionicframework.com/docs
- Express: https://expressjs.com/
- MySQL: https://dev.mysql.com/doc/

---

This file is only a study guide and does not modify the project system.
