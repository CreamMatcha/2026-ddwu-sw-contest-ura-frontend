interface CourseDotProps {
  color: string;
  size?: 6 | 8 | 10;
}

export function CourseDot({ color, size = 8 }: CourseDotProps) {
  return (
    <span
      aria-hidden
      style={{
        flex: 'none',
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
      }}
    />
  );
}
