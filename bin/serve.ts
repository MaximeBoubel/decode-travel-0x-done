// bin/serve.ts
import { MainApp } from "../src/MainApp";

const port = process.env.PORT || 3000;
const app = new MainApp().getApp();
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
