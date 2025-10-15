#Your approach to solving the problem

For design:
I began by thoroughly reading the project specs and conducting research sessions with GenAI to create a comprehensive development plan. For design I checked the company website and used similar visual elements and style Guidelines, created a quick mockup in Figma to visualize the user interface and define the component structure before starting development.

For implementation:
I used React’s useState hook to manage form inputs and validation errors efficiently. I implemented comprehensive client-side validation for required fields, email format, and other input constraints. To enhance user feedback, I designed clear visual states for different scenarios such as error, success, and loading. I also ensured the form was fully responsive across various devices and screen sizes. Throughout the process, I refined the user experience with clear, actionable error messages and smooth visual feedback to guide users through the registration process.

#2 How much AI did you use?

I fed both the requirements and my own ideas into GenAI to draft an initial document and generate the initial code structure, I still reviewed every block of code it produced and edited whenever something didn’t make sense to me. GenAI was also used for light tasks, such as generating CSS or listing as many potential test cases as possible to check if I missed anything to save time and keep the project moving efficiently. I also discussed and debugged with GenAI, especially when dealing with unfamiliar topics.

#3 In your opinion, where are the places you could do better?

For codebase:
Can have better code organization for further development and readability if the project becomes larger, like extracting validation logic into shared utilities, creating custom hooks for form management, and separating API client logic from components.

For UI/UX:
Can add a dynamic password strength indicator. Instead of showing errors only after blur/submit, we can provide real-time visual feedback, for example with a checklist. For aesthetic concern I didn't add it for it might take too much space, but the current implementation can be a hassle if users type a password that doesn’t meet the standards. We could show the requirements first, like giving hints before users start filling the input.

API:
I added simple APIs, but the server-side validation is not fully implemented, and API endpoints are exposed. Some methods could be added to maintain better security.
