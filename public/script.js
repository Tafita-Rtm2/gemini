const chatMessages = document.querySelector(".chat-messages");
const inputField = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-button");
const typingIndicator = document.querySelector(".typing-indicator");

function addMessage(text, type = "bot", imageUrl = null) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  if (imageUrl) {
    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    imgElement.className = "generated-image";
    messageDiv.appendChild(imgElement);

    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Télécharger";
    downloadButton.className = "download-button";
    downloadButton.onclick = () => {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = "image.jpg";
      link.click();
    };
    messageDiv.appendChild(downloadButton);
  } else {
    const textDiv = document.createElement("div");
    textDiv.className = "text";
    textDiv.textContent = text;
    messageDiv.appendChild(textDiv);
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendButton.addEventListener("click", async () => {
  const userInput = inputField.value.trim();
  if (!userInput) return;

  addMessage(userInput, "user");
  inputField.value = "";

  typingIndicator.style.display = "flex";

  if (userInput.startsWith("image:")) {
    const prompt = userInput.replace("image:", "").trim();
    const response = await fetch("/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (response.ok) {
      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      addMessage("", "bot", imageUrl);
    } else {
      addMessage("Impossible de générer l'image.", "bot");
    }
  } else {
    setTimeout(() => addMessage("Je ne sais pas répondre à ça pour l'instant.", "bot"), 1000);
  }

  typingIndicator.style.display = "none";
});
