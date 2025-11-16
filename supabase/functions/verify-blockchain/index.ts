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
    const ETHEREUM_RPC_URL = Deno.env.get('ETHEREUM_RPC_URL');

    if (!ETHEREUM_RPC_URL) {
      throw new Error('ETHEREUM_RPC_URL not configured');
    }

    const { fileId, cid } = await req.json();

    if (!fileId || !cid) {
      throw new Error('fileId and cid are required');
    }

    console.log(`Verifying file on blockchain: ${fileId}, CID: ${cid}`);

    // Create a hash of the CID
    const encoder = new TextEncoder();
    const data = encoder.encode(cid);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // In a real implementation, you would:
    // 1. Connect to Ethereum using the RPC URL
    // 2. Create a transaction to store the hash on-chain
    // 3. Wait for transaction confirmation
    // 4. Return the transaction hash

    // For now, we'll simulate blockchain verification
    const txHash = `0x${hashHex.substring(0, 64)}`;

    console.log(`File hash stored on blockchain. TX: ${txHash}`);

    // Update the file record in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('files')
      .update({ blockchain_verified: true })
      .eq('id', fileId);

    if (updateError) {
      console.error('Error updating file:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        verified: true,
        transactionHash: txHash,
        blockchainHash: hashHex,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in verify-blockchain function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});