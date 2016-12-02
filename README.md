# Literasee Visualizations

This repository is the central location for all code related to Literasee visualizations. Specific visualizations each have their own directory under the `packages` directory, while the root level is mostly dedicated to visualization hosting and display. All visualizations are developed with the assumption they will only be deployed within iframes.

# Local Development

To run a local server that mimics the live site, follow these steps:

1. Clone the repository and navigate to its directory on your machine
2. If you haven't done so previously, run `npm install`
3. Add `127.0.0.1	local.literasee.io` to your `/etc/hosts` file to enable use of that custom domain
4. Start the local data server as described [here](https://github.com/Literasee/literasee-data)
5. Run `npm start`
6. [http://local.literasee.io:3001/](http://local.literasee.io:3001/) will open in your default browser
7. To enable live reloading open a terminal in the `packages/cutscores` directory and run `npm start` to enable rebuilds on code changes

# Repository structure

This repository uses [Lerna](https://lernajs.io/) to enable semi-independent development of individual visualizations without each requiring its own repository.

The `index.html` file at the repository root is intended to demonstrate how visualizations can be embedded in host pages. The `data-pym-src` attribute is used to specify which visualization to use and what parameters to pass. The two script tags at the bottom of the page are also required in any host pages as they enable host/frame communication and are responsible for some of the shell UI.

The URL specified in `data-pym-src` can set optionally specify a number of parameters. These parameters are as follows:

* `state` - defaults to `CO` but can be replaced by any state abbreviation that maps to a file in the `cutscores/sgp` directory of the [literasee-data](https://github.com/Literasee/literasee-data) repository.
* `minYear` - defaults to `1900` and can be used to control which set(s) of cutscores are displayed by the chart.
* `maxYear` - defaults to `2100` and can be used to control which set(s) of cutscores are displayed by the chart.
* `subject` - has no default value, but whichever subject appears first in the data will be used if it's not set explicitly.
* `student` - is optional and has no default value.
* `showGrowth` - default to false and specifies whether or not the growth cuts will be displayed.

`index.html` also contains two examples of the "card" UI, which is defined using actual `iframe` tags that reference `card.html`. Other sites that want to display cards would obviously need to use the absolute URL of `http://viz.literasee.io/card.html`.

# Cutscores viz

The cutscores visualization is the only specialized visualization that exists at this time. Over the course of its development it has evolved into a fairly complex visualization made up of several layers. Each of these layers is briefly described below.

The first layer is the **basic cutscores layer**, implemented as a grayscale stacked area chart. The data for this layer is comprised of state cutscores data optionally combined with a student's historical data. This layer is always present.

The next layer is the **growth cuts layer**. This layer is only present if the URL provided to `data-pym-src` includes a `showGrowth=true` parameter. This is also a stacked area chart, is backed by a combination of state and student data like the basic cutscores, and it is generated with the same code as the basic cutscores. It is colored rather than grayscale. When growth cuts are included in a visualization, there will also be a subtle button displayed at the top right allowing them to be toggled on and off.

The **student scores layer** is the top layer of the chart, and is included any time the `data-pym-src` URL includes a `student` parameter. The student parameter should map to a file name (minus the `.json` extension) from the `students` directory in the [literasee-data](https://github.com/Literasee/literasee-data) repository.

Where applicable, student scores are connected by a **growth lines layer**. Currently, these growth lines are colored by mapping the score's `sgp` to a continuous red to blue scale. Growth lines are displayed any time there are student scores with `sgp` values.

Some student scores have trajectories associated with them. These are projections of growth that are also colored using the red to blue scale, this time mapping their percentile (1 to 99). The **trajectories layer** is only displayed when the corresponding score has been selected. While the score is selected, the visible trajectory can be changed using the scroll wheel or by attempting to drag the score up or down.

### Interactions

In addition to normal mouse interactions with the scores, and the trajectories interaction described above, the cutscores visualization also supports being maximized and zoomed.

Maximizing the visualization essentially moves it to a larger container that fills the window and floats it above all other content. The visualization can be un-maximized using the escape key, clicking outside the chart, or using the minimize button at top right.

Zooming into the visualization does not change its size on the page, it magnifies/scales the chart within its existing frame. Once zoomed in you can click and drag to pan the visualization, similar to the way things like Google Maps work. Zooming is done using the mouse wheel (or other "scroll" mechanism) while hovering over the cutscores background. You can reset the zoom state by simply scrolling in reverse or by using the Reset Zoom button at top right.

# Card UI

At the root of the repository is `card.html`, a self contained page intended for use on third party sites that links to a project in the Literasee viewer. `index.html` has two examples of using `card.html`, but for posterity let's look at what it would look like on a third party site.

```html
<iframe
    src="http://viz.literasee.io/card.html?title=A title to display&desc=A longer description&img=http://knowbetter.io/logo.png&repo=Literasee/Indiana"
    width="400"
    height="250"
    frameborder="0">
  </iframe>
```

Here we see the four parameters supported by cards: `title`, `desc`, `img`, and `repo`. The `img` parameter is optional. As shown above, the iframe should specify its `width`, `height`, and `frameborder`, unless the host site will account for styling in another manner.

# Status as of 11/28/2016

### Availability at viz.literasee.io

There are a few things involved in making this repository's contents available at https://viz.literasee.io

The `literasee.io` domain (as well as `literasee.org`) is registered with [iwantmyname.com](iwantmyname.com). On that site, the domain's DNS is configured to point to CloudFlare. This is done because CloudFlare offers free SSL (HTTPS) and better subdomain management.

On CloudFlare, we manage the various `literasee.io` subdomains. Some point to Heroku for the Literasee editor and viewer apps, but the `viz` subdomain is pointed to `literasee.github.io`, the automatically generated domain for the Literasee organization on GitHub.

The repository itself is then configured to enable GitHub Pages and use the `master` branch as the source. The `CNAME` file in the repository root tells GitHub that requests for `viz.literasee.io` should be treated as requests for this repository.