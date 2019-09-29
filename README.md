# Open Siddur Compiler

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