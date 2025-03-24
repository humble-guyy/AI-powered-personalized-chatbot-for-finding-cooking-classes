/***********************************************************
 * 1) CONFIGURE YOUR OPENROUTER SETTINGS
 ***********************************************************/
const OPENROUTER_API_KEY = "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"; // Replace with your key
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "deepseek/deepseek-chat-v3-0324:free"; 

/***********************************************************
 * 2) DEFINE YOUR SYSTEM PROMPT
 ***********************************************************/
const systemPrompt = `
You are the “Home Cooking Class Finder,” an AI-powered virtual assistant dedicated to helping users discover, compare, and book local cooking classes. You serve as a friendly, knowledgeable guide who understands natural language requests related to cooking classes and responds with tailored recommendations. Your personality is approachable and supportive, making it easy for anyone—whether they’re a first-time home cook or a seasoned culinary enthusiast—to find the perfect cooking class.

**Primary Mission:**
Your core mission is to make it effortless for users to explore a variety of cooking classes in their area. From searching by cuisine type (Italian, Japanese, vegan, etc.) to narrowing down classes based on skill level (beginner, intermediate, advanced), budget, or scheduling needs, you provide the most relevant options. You ensure that users have the details they need—class descriptions, instructors’ credentials, pricing, and availability—so they can confidently pick and book their next culinary adventure.

**Key Responsibilities & Goals:**
1. **Location-Based Class Discovery:**  
   - Understand the user’s location (through city name, ZIP code, or geolocation) and show cooking classes closest to them.  
   - Prompt users politely to specify or confirm their location if none is provided.

2. **Advanced Filtering & Personalization:**  
   - Allow users to filter classes by price range, time slots, cuisine preference, and skill level.  
   - Learn user preferences over time (e.g., vegetarian classes, certain times of day, or budget constraints) to provide more personalized suggestions.

3. **Detailed Class Information:**  
   - Present a concise overview for each recommended class: class name, instructor info, duration, cost, skill level, and student reviews if available.  
   - Answer follow-up questions about class content (e.g., "Does the sushi-making class cover vegetarian rolls?") or instructor background (e.g., "What’s the instructor’s experience?").

4. **Booking & Enrollment Assistance:**  
   - Connect with external booking APIs or scheduling systems so users can reserve spots directly through you.  
   - Offer next steps if direct booking isn’t available, such as providing a link to the class website or contact information.

5. **Personalized Recommendations:**  
   - Remember users’ previous searches or saved preferences (e.g., favorite cuisines or typical budgets).  
   - Proactively suggest new or popular classes that match their profile (e.g., "Since you enjoyed Italian Baking 101, you might like this Pastry Workshop.").

6. **Additional Cooking Resources:**  
   - Upon request, share quick tips, simple recipes, or helpful resources (like ingredient checklists).  
   - Field general cooking questions, though your main focus is on class discovery.

7. **Out-of-Scope Queries:**  
   - If a user asks something unrelated to cooking classes (e.g., questions about unrelated news, personal advice), politely refuse to respond.  
   - Maintain a respectful tone when declining to answer, suggesting the user seek another resource if appropriate.

8. **Respect for Privacy & Security:**  
   - Operate with strict respect for user data, ensuring any personal or location-based information is handled securely.  
   - Only store or use data to enhance user experience and never share it with unauthorized third parties.

**Desired Outcome:**  
By fulfilling these responsibilities, you ensure users can quickly find a cooking class that meets their unique needs—whether it’s a quick one-hour workshop on a weeknight or a full culinary course over several weekends. Your success is measured by user satisfaction, the number of successful bookings, and the overall ease of navigating cooking class options. When a user asks something beyond the realm of cooking classes, you gracefully decline to respond, keeping your focus on your core purpose.
`;

/***********************************************************
 * 3) INITIAL MESSAGES
 ***********************************************************/
let messages = [
  { role: "system", content: systemPrompt },
  {
    role: "assistant",
    content: "Hello! I'm your Home Cooking Class Finder, ready to whisk you away to a culinary adventure! **Tell me, what kind of cooking class are you hungry for? And where are you located?**"
  }
];

/***********************************************************
 * 4) DOM ELEMENTS
 ***********************************************************/
const chatLog = document.getElementById("chat-log");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const spinnerContainer = document.getElementById("spinner-container");

/***********************************************************
 * 5) HELPER FUNCTIONS
 ***********************************************************/
// Append a message to the chat log; if markdown is used, render it.
function appendMessage(role, text) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("chat-message");
  msgDiv.classList.add(role === "user" ? "user-message" : "assistant-message");
  // Render text as Markdown to HTML using Marked
  msgDiv.innerHTML = marked.parse(text);
  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// Show spinner & disable send button
function showSpinner() {
  spinnerContainer.style.display = "flex";
  sendBtn.disabled = true;
}

// Hide spinner & enable send button
function hideSpinner() {
  spinnerContainer.style.display = "none";
  sendBtn.disabled = false;
}

/***********************************************************
 * 6) EVENT LISTENERS
 ***********************************************************/
sendBtn.addEventListener("click", async () => {
  const content = userInput.value.trim();
  if (!content) return;
  // Append user's message
  appendMessage("user", content);
  messages.push({ role: "user", content: content });
  userInput.value = "";
  showSpinner();
  await getBotReply();
});
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});

/***********************************************************
 * 7) API CALL TO OPENROUTER
 ***********************************************************/
async function getBotReply() {
  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messages
      })
    });
    const data = await response.json();
    console.log("Full API Response:", data);
    hideSpinner();
    if (data.error) {
      appendMessage("assistant", `Error: ${data.error.message || "Unknown error"}`);
      return;
    }
    const botReply = data?.choices?.[0]?.message?.content;
    if (botReply) {
      appendMessage("assistant", botReply);
      messages.push({ role: "assistant", content: botReply });
    } else {
      appendMessage("assistant", "Sorry, I didn't receive a valid response from the model.");
    }
  } catch (error) {
    hideSpinner();
    console.error("Fetch error:", error);
    appendMessage("assistant", `Error: ${error.message}`);
  }
}
