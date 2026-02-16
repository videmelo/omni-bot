const Playing = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="2" y="8" width="5" height="12" fill="inherit" rx="1.5">
      <animate attributeName="height" values="6;12;6" dur="0.8s" repeatCount="indefinite" />
      <animate attributeName="y" values="14;8;14" dur="0.8s" repeatCount="indefinite" />
    </rect>
    <rect x="9.5" y="8" width="5" height="12" fill="inherit" rx="1.5">
      <animate
        attributeName="height"
        values="12;6;12"
        dur="0.8s"
        repeatCount="indefinite"
        begin="0.2s"
      />
      <animate attributeName="y" values="8;14;8" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
    </rect>
    <rect x="17" y="8" width="5" height="12" fill="inherit" rx="1.5">
      <animate
        attributeName="height"
        values="8;12;8"
        dur="0.8s"
        repeatCount="indefinite"
        begin="0.4s"
      />
      <animate
        attributeName="y"
        values="12;8;12"
        dur="0.8s"
        repeatCount="indefinite"
        begin="0.4s"
      />
    </rect>
  </svg>
);

export default Playing;
