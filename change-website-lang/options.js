// Update the TARGET_INFO in the background page
function updateBackgroundPage() {
  const backgroundPage = chrome.extension.getBackgroundPage();
  backgroundPage.updateTargetInfo();
}

document.addEventListener('DOMContentLoaded', function () {
  // Gets the target info from chrome.storage
  chrome.storage.local.get(['target_info'], function (result) {
    if (result.target_info) {
      document.getElementById('targetInfo').value = result.target_info;
    }
  });

  // Event listener for the save button
  document.getElementById('saveButton').addEventListener('click', () => {
    const targetInfo = document.getElementById('targetInfo').value;
    chrome.storage.local.set({ target_info: targetInfo }, function () {
      // Display a message to the user indicating that the data has been saved.
      displaySaveMessage();

      // Update the TARGET_INFO in the background page
      updateBackgroundPage();
    });
  });
});

// Display a message indicating when the mappings were last saved.
function displaySaveMessage() {
  const saveMessage = document.getElementById('saveMessage');
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(now.getDate()).padStart(2, '0')} ${String(
    now.getHours(),
  ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
    now.getSeconds(),
  ).padStart(2, '0')}`;
  saveMessage.textContent = `Saved at ${timestamp}`;
}
