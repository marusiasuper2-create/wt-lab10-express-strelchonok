const express = require("express");
const app = express();
const pool = require("./db");
const port = process.env.PORT || 3000;

app.use(express.json());

//задание 5. Информационный маршрут
app.get("/api/info", (req, res) => {
  res.json({
    application: "Web Technologies",
    technology: "Node.js + Express",
    database: "PostgreSQL"
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка подключения к базе данных" });
  }
});

//задание 6. Тестовый POST-маршрут
app.post("/api/test", (req, res) => {
  res.json({
    message: "Данные получены",
    data: req.body //здесь мы видим, что пришло в теле запроса
  });
});

app.get("/", (req, res) => {
  res.send("Express работает!");
});

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT "Id", "Title", "Author", "Year", "Price", "IsAvailable", "CreatedAt" 
       FROM "Books" 
       ORDER BY "Id"`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: "Ошибка получения книг" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query(
      `SELECT * FROM "Books" WHERE "Id" = $1`, 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Книга не найдена" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка получения книги" });
  }
});

app.post("/api/products", async (req, res) => {
try {
    const { title, author, year, price, isAvailable } = req.body;

    if (!title || !author || price === undefined) {
      return res.status(400).json({ error: "Некорректные данные книги" });
    }

    const result = await pool.query(
      `INSERT INTO "Books" ("Title", "Author", "Year", "Price", "IsAvailable") 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [title, author, year, price, isAvailable]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка создания книги" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, author, year, price, isAvailable } = req.body;

    const result = await pool.query(
      `UPDATE "Books" 
       SET "Title" = $1, "Author" = $2, "Year" = $3, "Price" = $4, "IsAvailable" = $5 
       WHERE "Id" = $6 
       RETURNING *`,
      [title, author, year, price, isAvailable, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Книга не найдена" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка изменения книги" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query(
      `DELETE FROM "Books" WHERE "Id" = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Книга не найдена" });
    }
    res.json({ message: "Книга удалена", book: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка удаления книги" });
  }
});

app.get("/api/products/search", async (req, res) => {
  try {
    const name = req.query.name || ""; 
    
    const result = await pool.query(
      `SELECT * FROM "Books" WHERE "Title" ILIKE $1 ORDER BY "Id"`,
      [`%${name}%`]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка поиска" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

//запуск сервера
app.listen(port, "0.0.0.0", () => {
  console.log(`Server started on port ${port}`);
});