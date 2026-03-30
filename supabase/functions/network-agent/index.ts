import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { company_name, scan_id, agent_version, network_range, devices } = body;

    if (!company_name || !devices || !Array.isArray(devices)) {
      return new Response(
        JSON.stringify({ error: "company_name e devices são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create network scan record
    const { data: scanRecord, error: scanError } = await supabase
      .from("network_scans")
      .insert({
        scan_id: scan_id || null,
        company_name,
        total_devices: devices.length,
        total_vulnerabilities: devices.reduce((acc: number, d: any) => acc + (d.vulnerabilities?.length || 0), 0),
        critical_devices: devices.filter((d: any) => d.risk_level === "critical" || d.risk_level === "high").length,
        scan_status: "completed",
        agent_version: agent_version || "1.0.0",
        network_range: network_range || "unknown",
      })
      .select()
      .single();

    if (scanError) {
      console.error("Error creating network scan:", scanError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar scan de rede" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert devices
    const deviceRecords = devices.map((d: any) => ({
      scan_id: scan_id || null,
      company_name,
      ip_address: d.ip_address,
      mac_address: d.mac_address || null,
      hostname: d.hostname || null,
      os_detected: d.os_detected || null,
      os_version: d.os_version || null,
      device_type: d.device_type || "unknown",
      open_ports: d.open_ports || [],
      vulnerabilities: d.vulnerabilities || [],
      risk_level: d.risk_level || "low",
      status: d.status || "online",
    }));

    const { error: devicesError } = await supabase
      .from("network_devices")
      .insert(deviceRecords);

    if (devicesError) {
      console.error("Error inserting devices:", devicesError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar dispositivos" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        network_scan_id: scanRecord.id,
        devices_count: devices.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Network agent error:", e);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
