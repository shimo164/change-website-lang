# change-website-lang

## Notice
- Beta: Locale in AWS document <https://docs.aws.amazon.com> is changed from english to japanese. Before start, set the locale of the doc page to English. (hard coded as `const langCode = 'ja_jp';`)

## About
- Chrome extension for quickly switching between two locales on any given website.
- The scroll position is retained when switching between locales.

![demo](https://user-images.githubusercontent.com/24565156/218289531-1ff1edad-562f-4f4c-a2ab-b7bb2a4135cc.gif)


## How to Use
- Click on the extension icon in the Chrome toolbar to switch between locales for the current page.
- The switch will happen seamlessly, reloading the page in the new locale.

## How to Set Target URLs and Locales
- Right-click the extension icon and select "Options". In the textarea, enter the root URL and the two locales you want to switch between for each website.
- Each entry should be on a new line.
- Format: Enter the root URL, followed by the two locales, each separated by a comma.
  - Example: https://learn.microsoft.com, en-us, ja-jp
  - In this example, the extension will toggle between the 'en-us' and 'ja-jp' locales for any URL starting with 'https://learn.microsoft.com'.
- Please note that the locales should match exactly with the URL segment for the locale on the website.

# How to install
- Download the folder of change-website-lang/.
- Go to chrome://extensions/, turn on Developer mode.
- Click Load unpacked
- Find and select the folder
- See https://support.google.com/chrome/a/answer/2714278?hl=en


# Acknowledgement
<a href="https://www.flaticon.com/free-icons/globe" title="globe icons">Globe icons created by th studio - Flaticon</a>
