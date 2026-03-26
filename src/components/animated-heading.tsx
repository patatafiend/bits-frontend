export type AnimatedHeadingProps = {
  children: string;
  className?: string;
  delay?: number;
};

export function AnimatedHeading({
  children,
  className = "",
  delay = 40,
}: AnimatedHeadingProps) {
  return (
    <span className={className} aria-label={children}>
      {children.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block animate-letter-drop"
          style={{
            animationDelay: `${i * delay}ms`,
            whiteSpace: char === " " ? "pre" : undefined,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
