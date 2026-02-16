const Orbit: React.FC<React.SVGProps<SVGSVGElement>> = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="144"
    height="114"
    viewBox="0 0 144 114"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      opacity="0.1"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M99.4375 69.25C131.366 69.25 157.25 43.3665 157.25 11.4375C157.25 -20.4915 131.366 -46.375 99.4375 -46.375C67.5085 -46.375 41.625 -20.4915 41.625 11.4375C41.625 43.3665 67.5085 69.25 99.4375 69.25Z"
      fill="inherit"
      stroke="none"
    />
    <path
      opacity="0.2"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M101 113C156.228 113 201 68.2285 201 13C201 -42.2285 156.228 -87 101 -87C45.7715 -87 1 -42.2285 1 13C1 68.2285 45.7715 113 101 113Z"
      stroke="inherit"
      fill="none"
    />
  </svg>
);

export default Orbit;
