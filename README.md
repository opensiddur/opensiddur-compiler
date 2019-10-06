# Open Siddur Compiler

Build status:
master: [![master build status](https://travis-ci.org/opensiddur/opensiddur-compiler.svg?branch=master)](https://travis-ci.org/opensiddur/opensiddur)
develop: [![develop build status](https://travis-ci.org/opensiddur/opensiddur-compiler.svg?branch=develop)](https://travis-ci.org/opensiddur/opensiddur)


With the advent of JLPTEI 2.0, which is not backwards compatible with JLPTEI 1.0,
there is a need to temporarily disable most components of the prior editing app.
This is also an opportunity to modernize the code and make it more modular 
and testable.

This app is intended to be:
1. A stopgap allowing compilation of documents before we have a new editing app.
2. A testbed for new components and technologies that might be adopted in the 
next version of the Open Siddur client.

As a first MVP, the client will have 3 views:
1. A list component that provides a scrollable list of all available (original) documents 
in the database.
2. A compiler component that shows the progress of a running compilation
3. A viewer component that provides an embedded viewer for compiled documents.
4. A main view that initially displays the list component.

All users will be logged in as the guest user, so there will be no facility
here to edit documents.
When these are complete, Open Siddur Compiler 1.0 will be released.

Future versions will include:
1. A search bar to find starting documents.
2. A list of suggested starting documents (a siddur, a mahzor, a haggadah, eg.)

## Build information

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
