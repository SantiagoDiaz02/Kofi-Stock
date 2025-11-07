const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const tableContainer = document.getElementById("tableContainer");
const statusText = document.getElementById("status");

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Por favor seleccioná un archivo Excel primero.");
    return;
  }

  statusText.textContent = "Procesando archivo...";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("http://localhost:4000/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      alert("❌ Error: " + (result.error || "No se pudo procesar el archivo."));
      statusText.textContent = "Error en el procesamiento.";
      return;
    }

    renderTable(result.lowStock);
    if (result.lowStock.length > 0) {
      alert("⚠️ Se enviaron alertas de stock bajo a tu Telegram!");
    } else {
      alert("✅ Todo en orden. No hay productos por debajo del mínimo.");
    }

    statusText.textContent = "Listo.";
  } catch (err) {
    console.error(err);
    alert("❌ Error al conectar con el servidor.");
    statusText.textContent = "Error.";
  }
});

function renderTable(data) {
  if (!data || data.length === 0) {
    tableContainer.innerHTML = "<p>✅ Todo en orden. No hay productos por debajo del mínimo.</p>";
    return;
  }

  let html = "<table><tr>";
  Object.keys(data[0]).forEach(key => {
    html += `<th>${key}</th>`;
  });
  html += "</tr>";

  data.forEach(row => {
    html += `<tr class="low-stock">`;
    Object.values(row).forEach(value => {
      html += `<td>${value}</td>`;
    });
    html += "</tr>";
  });

  html += "</table>";
  tableContainer.innerHTML = html;
}
