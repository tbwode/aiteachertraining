export const getRandomUserAvatar = () => {
  const defaultAvatars = [
    // '/imgs/avatar/RoyalBlueAvatar.svg',
    // '/imgs/avatar/PurpleAvatar.svg',
    // '/imgs/avatar/AdoraAvatar.svg',
    // '/imgs/avatar/OrangeAvatar.svg',
    // '/imgs/avatar/RedAvatar.svg',
    // '/imgs/avatar/GrayModernAvatar.svg',
    // '/imgs/avatar/TealAvatar.svg',
    // '/imgs/avatar/GreenAvatar.svg',
    // '/imgs/avatar/BrightBlueAvatar.svg',
    // '/imgs/avatar/BlueAvatar.svg'
    '/imgs/zhique_avatar/red.svg',
    '/imgs/zhique_avatar/orange.svg',
    '/imgs/zhique_avatar/gray.svg',
    '/imgs/zhique_avatar/green.svg',
    '/imgs/zhique_avatar/blue.svg'
  ];

  return defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
};
