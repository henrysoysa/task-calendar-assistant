import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// Initialize Google Sheets API with proper error handling
const getGoogleSheetsClient = () => {
  try {
    const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credentials) {
      throw new Error('Google Sheets credentials not found in environment variables');
    }

    const parsedCredentials = JSON.parse(credentials);
    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    throw new Error('Failed to initialize Google Sheets client');
  }
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    const body = await request.json();
    
    const spreadsheetId = process.env.FEEDBACK_SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID not found in environment variables');
    }

    const sheets = getGoogleSheetsClient();
    
    // Append the feedback to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:C', // Assumes columns A=timestamp, B=comment, C=userId
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          body.timestamp,
          body.comment,
          body.userId || 'Anonymous'
        ]],
      },
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 