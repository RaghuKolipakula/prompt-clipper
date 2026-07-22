document.getElementById('clipBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.id) return;

  // Execute extraction script on the active tab
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selection = window.getSelection().toString();
      // Use highlighted text if present, otherwise extract body innerText
      const text = selection.trim().length > 0 ? selection : document.body.innerText;
      return {
        title: document.title,
        url: window.location.href,
        content: text.replace(/\s+/g, ' ').trim().slice(0, 4000) // Clean whitespace & cap size
      };
    }
  }, async (results) => {
    if (!results || !results[0] || !results[0].result) return;
    
    const { title, url, content } = results[0].result;
    
    // Format into structured Markdown
    const formattedPrompt = `### Source Context\n**Title:** ${title}\n**URL:** ${url}\n\n**Extracted Content:**\n${content}\n\n---\n*Prompt:* Summarize key takeaways and actionable insights from the context above.`;
    
    try {
      // Copy to system clipboard
      await navigator.clipboard.writeText(formattedPrompt);
      
      // Show confirmation badge
      const statusDiv = document.getElementById('status');
      statusDiv.style.display = 'block';
      setTimeout(() => { 
        statusDiv.style.display = 'none'; 
      }, 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  });
});