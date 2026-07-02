interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 14, style }: SkeletonProps) {
  return <span className="skeleton" style={{ width, height, ...style }} aria-hidden="true" />;
}

export function SkeletonRows({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }, (_, c) => (
            <td key={c}>
              <Skeleton width={c === 0 ? "70%" : "45%"} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
