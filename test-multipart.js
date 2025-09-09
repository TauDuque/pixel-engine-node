const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function testMultipartUpload() {
  try {
    // Cria um arquivo de teste temporário
    const testImagePath = path.join(
      __dirname,
      "src",
      "tests",
      "fixtures",
      "more.png"
    );

    if (!fs.existsSync(testImagePath)) {
      console.error("Arquivo de teste não encontrado:", testImagePath);
      return;
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(testImagePath), {
      filename: "jeanne dark 2024-09-09 10-30-45.jpg", // Nome com timestamp
      contentType: "image/png",
    });

    console.log("Testando upload multipart...");
    console.log("Arquivo:", testImagePath);
    console.log("Nome do arquivo:", "jeanne dark 2024-09-09 10-30-45.jpg");

    const response = await fetch("http://localhost:3000/api/tasks", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const result = await response.json();

    console.log("Status:", response.status);
    console.log("Resposta:", JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("✅ Upload multipart funcionou!");
      console.log("Task ID:", result.data.taskId);
      console.log("Status:", result.data.status);
      console.log("Preço:", result.data.price);
    } else {
      console.log("❌ Erro no upload multipart");
    }
  } catch (error) {
    console.error("Erro no teste:", error.message);
  }
}

testMultipartUpload();
