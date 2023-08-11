import { templates, select, classNames } from '../settings.js';

const homepageData = {
  galleryLinks: [
    'images/homepage/pizza-4.jpg',
    'images/homepage/pizza-5.jpg',
    'images/homepage/pizza-6.jpg',
    'images/homepage/pizza-7.jpg',
    'images/homepage/pizza-8.jpg',
    'images/homepage/pizza-9.jpg',
  ],
  carouselData: [
    {
      img: 'images/homepage/pizza-3.jpg',
      title: 'Lorem Ipsum',
      text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe totam inventore, debitis',
      author: 'Abraham Lincoln',
    },
    {
      img: 'images/homepage/pizza-3.jpg',
      title: 'More Lorem',
      text: 'In illum ullam iure necessitatibu sconsectetur rem beatae aspernatur dolores maiores, optio placeat natus magnam.',
      author: 'Donalnd Trump',
    },
    {
      img: 'images/homepage/pizza-3.jpg',
      title: 'Even More',
      text: 'Rem beatae aspernatur dolores maiores consectetur adipisicing elit.',
      author: 'Mariusz Pudzianowski',
    },
  ],
};

class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.data = homepageData;
    thisHome.render(element);
    thisHome.changePages();
  }

  render(element) {
    const thisHome = this;

    thisHome.dom = {};
    thisHome.dom.wrapper = element;

    const generatedHTML = templates.homePage(thisHome.data);

    document.querySelector(select.containerOf.home).innerHTML = generatedHTML;

    thisHome.dom.links = thisHome.dom.wrapper.querySelectorAll(
      select.containerOf.homeLinks
    );
  }

  changePages() {
    const thisHome = this;

    for (let link of thisHome.dom.links) {
      link.addEventListener('click', function (e) {
        e.preventDefault();

        const newHash = e.target.hash.replace('#', '');
        const currentLink = document.querySelector('.main-nav a[href="#home"]');
        const currentPageId = document.getElementById(
          select.containerOf.homeId
        );
        const newPageId = document.getElementById(newHash);
        const newLink = document.querySelector(
          `.main-nav a[href="${e.target.hash}"]`
        );

        window.location.hash = `#/${newHash}`;
        currentLink.classList.remove(classNames.nav.active);
        currentPageId.classList.remove(classNames.nav.active);
        newLink.classList.add(classNames.pages.active);
        newPageId.classList.add(classNames.pages.active);
      });
    }
  }
}

export default Home;
