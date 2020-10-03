module.exports = {
  data: {
    menus: [
      {
        name: 'Home',
        icon: 'aperture',
        link: 'index.html'
      },
      {
        name: 'Features',
        link: 'features.html'
      },
      {
        name: 'About',
        link: 'about.html'
      },
      {
        name: 'Contact',
        link: '#',
        children: [
          {
            name: 'Github',
            link: 'https://github.com/leebailin'
          },
          {
            name: 'About',
            link: 'https://baidu.com/'
          },
          {
            name: 'divider'
          },
          {
            name: 'About',
            link: 'https://github.com/leebailin'
          }
        ]
      }
    ],
    pkg: require('./package.json'),
    date: new Date()
  },
  build: {
    temp: '.temp',
    dest: 'release'
  }
}
