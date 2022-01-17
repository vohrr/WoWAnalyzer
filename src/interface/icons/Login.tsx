import * as React from 'react';

type Props = Omit<React.ComponentPropsWithoutRef<'svg'>, 'xmlns' | 'viewBox' | 'className'>;

// https://thenounproject.com/term/login/214301/
// Login by Yaroslav Samoylov from the Noun Project
const Icon = (props: Props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className="icon" {...props}>
    <path d="M24,90h-3c-4.962,0-9-4.037-9-9V14c0-4.963,4.038-9,9-9h3v2h-3c-3.86,0-7,3.141-7,7v67c0,3.859,3.14,7,7,7   h3V90z" />
    <path d="M37.107,96H37c-4.962,0-9-4.037-9-9V9c0-4.963,4.038-9,9-9l0.211,0.022l30.69,6.636   C72.015,7.547,75,11.247,75,15.455v65.09c0,4.208-2.985,7.908-7.098,8.797L37.107,96z M36.896,2.001C33.084,2.057,30,5.175,30,9v78   c0,3.825,3.084,6.943,6.896,6.999l30.583-6.612C70.678,86.695,73,83.818,73,80.545v-65.09c0-3.273-2.322-6.15-5.521-6.842   L36.896,2.001z" />
    <path d="M38.625,52.75c-2.033,0-3.625-2.142-3.625-4.875S36.592,43,38.625,43s3.625,2.142,3.625,4.875   S40.658,52.75,38.625,52.75z M38.625,45C37.856,45,37,46.181,37,47.875s0.856,2.875,1.625,2.875s1.625-1.181,1.625-2.875   S39.394,45,38.625,45z" />
  </svg>
);

export default Icon;
