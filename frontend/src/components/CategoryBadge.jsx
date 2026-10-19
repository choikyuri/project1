// 카테고리 배치 - 카테고리마다 색이 다름

import { getCategoryLabel } from "../constants/categories";

function CategoryBadge({ code }) {
  // 'CAFE' → 'badge badge-cafe' (toLowerCase : 소문자로)
  const className = `badge badge-${code.toLowerCase()}`;
  return <span className={className}>{getCategoryLabel(code)}</span>;
}

export default CategoryBadge;
