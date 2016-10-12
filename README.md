# Plokamos

Plokamos is a web-client for creating, editing and viewing annotations in controlled vocabularies.

Plokamos is meant to be applied onto web-content using the [Open Annotation]() address and selector scheme to anchor annotations in their target data. Currently it is restricted to text-based annotation with the [OA:TextQuoteSelector]() but extending it to further types of selectors that can annotate other kinds of data sources is planned for the [near future]().

The annotation body is expressed as linked data using controlled vocabularies and ontologies that Plokamos retrieves from a remote triple store. The data architecture allows for segmenting and merging the individual annotations according to a range of parameters, enabling collaboration between users and across single documents or entire collections/corpora.

## Usage

After being applied onto a web-content, Plokamos provides a static bar at the bottom of the window as well as a Bootstrap Popover UI control.

## Installation

Plokamos uses [Rollup.js]() as its build system. After installing its dependencies with `bower install` & `npm install`, the command to compile the source into a monolithic JS file is simply `rollup -c`. Currently [rdfstore-js]() is not being compiled and needs to be provided manually. Likewise, styling from the `annotator.css` file needs to be available for the UI to display correctly.

Currently, Plokamos is meant to be used as a [plugin]() to the [Nemo/Capitains]() CTS web interface. The plugin provides configuration of the document ID and the address of a remote triple store via HTML `data` attributes.

## Architecture

## Ontologies
