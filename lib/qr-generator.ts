// QR Code Generator Utility
// This file provides functions to generate QR codes for puzzle pieces

export interface QRCodeData {
  unlockCode: string;
  puzzleTitle: string;
  pieceId: string;
  position: {
    row: number;
    col: number;
  };
}

export function generatePieceUnlockCode(puzzleUnlockCode: string, row: number, col: number): string {
  return `${puzzleUnlockCode}_piece_${row}_${col}`;
}

export function generateQRCodeURL(unlockCode: string): string {
  // Generate a URL that visitors can scan or visit
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/qr-scanner?code=${encodeURIComponent(unlockCode)}`;
}

export function generateQRCodeData(puzzleUnlockCode: string, puzzleTitle: string, rows: number, cols: number): QRCodeData[] {
  const qrCodes: QRCodeData[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pieceId = `${row}-${col}`;
      const unlockCode = generatePieceUnlockCode(puzzleUnlockCode, row, col);
      
      qrCodes.push({
        unlockCode,
        puzzleTitle,
        pieceId,
        position: { row, col }
      });
    }
  }
  
  return qrCodes;
}

// Example usage for the seeder
export function generateSampleQRCodes() {
  const puzzles = [
    {
      unlockCode: 'mountain_landscape_2024',
      title: 'Mountain Landscape',
      rows: 4,
      cols: 6
    },
    {
      unlockCode: 'vintage_street_2024',
      title: 'Vintage Street Scene',
      rows: 5,
      cols: 7
    },
    {
      unlockCode: 'ocean_sunset_2024',
      title: 'Ocean Sunset',
      rows: 6,
      cols: 8
    },
    {
      unlockCode: 'city_skyline_2024',
      title: 'City Skyline',
      rows: 4,
      cols: 5
    },
    {
      unlockCode: 'forest_path_2024',
      title: 'Forest Path',
      rows: 5,
      cols: 6
    }
  ];

  const allQRCodes: QRCodeData[] = [];
  
  puzzles.forEach(puzzle => {
    const qrCodes = generateQRCodeData(puzzle.unlockCode, puzzle.title, puzzle.rows, puzzle.cols);
    allQRCodes.push(...qrCodes);
  });

  return allQRCodes;
}

// Function to print QR codes for manual creation
export function printQRCodeInstructions() {
  const qrCodes = generateSampleQRCodes();
  
  console.log('\n🎯 QR Code Generation Instructions:');
  console.log('=====================================\n');
  
  qrCodes.forEach((qrCode, index) => {
    console.log(`${index + 1}. ${qrCode.puzzleTitle} - Piece ${qrCode.pieceId}`);
    console.log(`   Unlock Code: ${qrCode.unlockCode}`);
    console.log(`   Position: Row ${qrCode.position.row}, Col ${qrCode.position.col}`);
    console.log(`   URL: ${generateQRCodeURL(qrCode.unlockCode)}`);
    console.log('');
  });
  
  console.log('📱 To create QR codes:');
  console.log('   1. Use an online QR code generator (e.g., qr-code-generator.com)');
  console.log('   2. Enter the unlock code or URL for each piece');
  console.log('   3. Print and place around the exhibition venue');
  console.log('   4. Each QR code should unlock one specific puzzle piece');
}

// Export for use in other files
export default {
  generatePieceUnlockCode,
  generateQRCodeURL,
  generateQRCodeData,
  generateSampleQRCodes,
  printQRCodeInstructions
};
