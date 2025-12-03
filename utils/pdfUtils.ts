
/**
 * Converts an array of page numbers into a formatted range string.
 * Example: [1, 2, 3, 5, 7, 8] -> "1-3, 5, 7-8"
 */
export const formatPageRanges = (pageNumbers: number[]): string => {
  if (pageNumbers.length === 0) return "None";

  // Ensure sorted and unique
  const sorted = [...new Set(pageNumbers)].sort((a, b) => a - b);
  
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = current;
      prev = current;
    }
  }
  
  // Push the final range
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);

  return ranges.join(", ");
};

/**
 * Analyzes ImageData to determine if it contains significant color.
 * Returns metrics about color usage.
 */
export const analyzeImagePixelData = (
  data: Uint8ClampedArray, 
  varianceThreshold: number = 20, 
  coverageThreshold: number = 0.002
): { isColor: boolean; colorPixels: number; totalPixels: number } => {
  let colorPixelCount = 0;
  const totalPixels = data.length / 4; // RGBA

  // Loop through pixels (R, G, B, A)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate maximum difference between channels
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));

    if (maxDiff > varianceThreshold) {
      colorPixelCount++;
    }
  }

  const coverage = colorPixelCount / totalPixels;
  
  return {
    isColor: coverage > coverageThreshold,
    colorPixels: colorPixelCount,
    totalPixels
  };
};

/**
 * Calculates 'Smart Split' statistics for efficient printing.
 * 
 * Logic:
 * 1. Perfect Double Color: Sheet where Both Odd & Even are Color.
 * 2. Perfect Double B&W: Sheet where Both Odd & Even are B&W.
 * 3. Mixed / Single: Sheet where one is Color and one is B&W.
 *    - The Color page goes to 'mixedColorPages'
 *    - The B&W page goes to 'mixedBWPages'
 */
export const calculateSmartSplitStats = (
  allPagesStatus: { pageNumber: number; isColor: boolean }[],
  totalPages: number
): { 
  doubleColorSheets: number[];
  doubleBWSheets: number[];
  mixedColorPages: number[];
  mixedBWPages: number[];
} => {
  const doubleColorSet = new Set<number>();
  const doubleBWSet = new Set<number>();
  const mixedColorSet = new Set<number>();
  const mixedBWSet = new Set<number>();
  
  const pageMap = new Map<number, boolean>();
  allPagesStatus.forEach(p => pageMap.set(p.pageNumber, p.isColor));

  // Iterate by sheets (1-2, 3-4, 5-6...)
  for (let i = 1; i <= totalPages; i += 2) {
    const pageA = i;        // Odd Page
    const pageB = i + 1;    // Even Page
    
    const isAColor = pageMap.get(pageA) || false;
    const hasB = pageB <= totalPages;
    const isBColor = hasB ? (pageMap.get(pageB) || false) : false;

    if (!hasB) {
        // Last single page
        if (isAColor) mixedColorSet.add(pageA);
        else mixedBWSet.add(pageA);
        continue;
    }

    // Check Sheet Status
    if (isAColor && isBColor) {
        // PERFECT DOUBLE COLOR
        doubleColorSet.add(pageA);
        doubleColorSet.add(pageB);
    } else if (!isAColor && !isBColor) {
        // PERFECT DOUBLE B&W
        doubleBWSet.add(pageA);
        doubleBWSet.add(pageB);
    } else {
        // MIXED SHEET (Problematic for double side)
        // Split them into single lists
        if (isAColor) mixedColorSet.add(pageA);
        else mixedBWSet.add(pageA);

        if (isBColor) mixedColorSet.add(pageB);
        else mixedBWSet.add(pageB);
    }
  }

  return { 
    doubleColorSheets: Array.from(doubleColorSet).sort((a, b) => a - b),
    doubleBWSheets: Array.from(doubleBWSet).sort((a, b) => a - b),
    mixedColorPages: Array.from(mixedColorSet).sort((a, b) => a - b),
    mixedBWPages: Array.from(mixedBWSet).sort((a, b) => a - b),
  };
};
