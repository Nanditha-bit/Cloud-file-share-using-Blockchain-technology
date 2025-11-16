import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PINATA_API_KEY = Deno.env.get('PINATA_API_KEY');
    const PINATA_API_SECRET = Deno.env.get('PINATA_API_SECRET');

    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      throw new Error('PINATA credentials not configured');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Uploading file to IPFS: ${file.name}, size: ${file.size}`);

    // Create a new FormData for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    const pinataMetadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        userId: userId,
        uploadedAt: new Date().toISOString(),
      }
    });
    pinataFormData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormData.append('pinataOptions', pinataOptions);

    // Upload to IPFS via Pinata
    const pinataResponse = await fetch(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      {
        method: 'POST',
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_API_SECRET,
        },
        body: pinataFormData,
      }
    );

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error('Pinata error:', errorText);
      throw new Error(`Failed to upload to IPFS: ${errorText}`);
    }

    const pinataData = await pinataResponse.json();
    console.log('File uploaded to IPFS:', pinataData);

    return new Response(
      JSON.stringify({
        cid: pinataData.IpfsHash,
        timestamp: pinataData.Timestamp,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in upload-to-ipfs function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});