const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

sendButton.addEventListener("click", sendMessage);

function appendMessage(text, sender, isImage = false) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  const avatar = document.createElement("img");
  avatar.src = sender === "user" ? "user.jpg" : "chat.jpg";

  const messageText = document.createElement("div");
  messageText.classList.add("message-text");

  if (isImage) {
    const img = document.createElement("img");
    img.src = text;
    img.style.maxWidth = "100%";
    messageText.appendChild(img);

    // Bouton de téléchargement
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Télécharger";
    downloadBtn.onclick = () => window.open(text, "_blank");
    messageText.appendChild(downloadBtn);
  } else {
    messageText.textContent = text;
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(messageText);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  userInput.value = "";

  if (text.startsWith("image:")) {
    const prompt = text.replace("image:", "").trim();
    fetch("/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          appendMessage(data.imageUrl, "bot", true);
        } else {
          appendMessage("Erreur lors de la génération de l'image.", "bot");
        }
      });
  } else {
    typingIndicator.style.display = "block";
    setTimeout(() => {
      typingIndicator.style.display = "none";
      appendMessage("Je ne comprends pas cette commande.", "bot");
    }, 1000);
  }
}
