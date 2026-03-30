#!/usr/bin/env python3
"""
SafeScore Network Agent v1.0
Desenvolvido por Compueletro

Este agente escaneia a rede interna, detecta dispositivos conectados,
identifica sistemas operacionais e verifica vulnerabilidades.

Requisitos:
  pip install scapy requests python-nmap

Uso:
  sudo python3 safescore-agent.py --company "Nome da Empresa" --range 192.168.1.0/24

  (Requer privilégios de administrador para scan de rede)
"""

import argparse
import json
import platform
import socket
import subprocess
import sys
import time
from datetime import datetime

try:
    import requests
except ImportError:
    print("[!] Instalando dependência: requests")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

SAFESCORE_API = "https://qoaqldcghzexfrvxxzsd.supabase.co/functions/v1/network-agent"
AGENT_VERSION = "1.0.0"

# Portas comuns para scan
COMMON_PORTS = [
    21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445,
    993, 995, 1433, 3306, 3389, 5432, 5900, 8080, 8443
]

RISKY_PORTS = {
    21: ("FTP", "critical", "Transferência sem criptografia"),
    23: ("Telnet", "critical", "Protocolo texto plano - altamente inseguro"),
    25: ("SMTP", "medium", "Servidor de email exposto"),
    135: ("MSRPC", "high", "Serviço Windows RPC exposto"),
    139: ("NetBIOS", "high", "Compartilhamento Windows exposto"),
    445: ("SMB", "high", "SMB exposto - risco de ransomware"),
    1433: ("MSSQL", "high", "Banco de dados SQL Server exposto"),
    3306: ("MySQL", "high", "Banco de dados MySQL exposto"),
    3389: ("RDP", "high", "Acesso remoto sem proteção verificada"),
    5432: ("PostgreSQL", "high", "Banco de dados PostgreSQL exposto"),
    5900: ("VNC", "high", "Acesso remoto VNC sem criptografia"),
}

SAFE_PORTS = {
    22: ("SSH", "low", "Acesso remoto seguro"),
    80: ("HTTP", "medium", "Servidor web sem HTTPS"),
    443: ("HTTPS", "low", "Servidor web seguro"),
    53: ("DNS", "low", "Servidor DNS"),
    993: ("IMAPS", "low", "Email seguro"),
    995: ("POP3S", "low", "Email seguro"),
    8443: ("HTTPS-Alt", "low", "HTTPS alternativo"),
}


def print_banner():
    print("""
╔══════════════════════════════════════════════════╗
║           SafeScore Network Agent v1.0           ║
║          Desenvolvido por Compueletro            ║
╠══════════════════════════════════════════════════╣
║  Escaneamento de Rede Interna                    ║
║  Detecção de SO e Vulnerabilidades               ║
╚══════════════════════════════════════════════════╝
    """)


def get_local_ip():
    """Detecta o IP local da máquina."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def detect_network_range(local_ip):
    """Deduz o range /24 a partir do IP local."""
    parts = local_ip.split(".")
    return f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"


def ping_host(ip, timeout=1):
    """Verifica se um host está ativo via ping."""
    param = "-n" if platform.system().lower() == "windows" else "-c"
    try:
        result = subprocess.run(
            ["ping", param, "1", "-W" if platform.system().lower() != "windows" else "-w",
             str(timeout * 1000 if platform.system().lower() == "windows" else timeout), ip],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=timeout + 2
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def discover_hosts_ping(network_range):
    """Descobre hosts ativos via ping sweep."""
    print(f"\n[*] Iniciando descoberta de hosts em {network_range}...")
    base = ".".join(network_range.split(".")[:3])
    active_hosts = []

    for i in range(1, 255):
        ip = f"{base}.{i}"
        sys.stdout.write(f"\r[*] Verificando {ip}...   ")
        sys.stdout.flush()
        if ping_host(ip):
            active_hosts.append(ip)
            print(f"\n[+] Host ativo: {ip}")

    print(f"\n[*] {len(active_hosts)} hosts ativos encontrados")
    return active_hosts


def discover_hosts_arp():
    """Tenta descobrir hosts via tabela ARP (mais rápido)."""
    hosts = []
    try:
        if platform.system().lower() == "windows":
            result = subprocess.run(["arp", "-a"], capture_output=True, text=True, timeout=10)
        else:
            result = subprocess.run(["arp", "-a"], capture_output=True, text=True, timeout=10)

        for line in result.stdout.split("\n"):
            parts = line.split()
            for part in parts:
                if part.count(".") == 3:
                    try:
                        socket.inet_aton(part)
                        if not part.startswith("255.") and part != "0.0.0.0":
                            hosts.append(part)
                            break
                    except socket.error:
                        continue
    except Exception as e:
        print(f"[!] ARP scan falhou: {e}")

    return list(set(hosts))


def scan_port(ip, port, timeout=1):
    """Verifica se uma porta está aberta."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((ip, port))
        sock.close()
        return result == 0
    except Exception:
        return False


def scan_ports(ip):
    """Escaneia portas comuns de um host."""
    open_ports = []
    for port in COMMON_PORTS:
        if scan_port(ip, port):
            if port in RISKY_PORTS:
                service, risk, desc = RISKY_PORTS[port]
            elif port in SAFE_PORTS:
                service, risk, desc = SAFE_PORTS[port]
            else:
                service, risk, desc = f"Port-{port}", "low", f"Serviço na porta {port}"

            open_ports.append({
                "port": port,
                "service": service,
                "risk": risk,
                "description": desc
            })
    return open_ports


def detect_os(ip, open_ports):
    """Tenta detectar o SO baseado nas portas e comportamento."""
    port_numbers = [p["port"] for p in open_ports]

    # Windows indicators
    windows_ports = {135, 139, 445, 3389}
    linux_ports = {22}
    network_ports = {161, 53}

    windows_score = len(windows_ports & set(port_numbers))
    linux_score = len(linux_ports & set(port_numbers))

    os_name = "Desconhecido"
    os_version = ""
    device_type = "unknown"

    if windows_score >= 2:
        os_name = "Windows"
        os_version = "Windows (detectado via portas SMB/RPC)"
        device_type = "workstation"
    elif 22 in port_numbers and windows_score == 0:
        os_name = "Linux/Unix"
        os_version = "Linux/Unix (detectado via SSH)"
        device_type = "server"
    elif 80 in port_numbers or 443 in port_numbers:
        if 8080 in port_numbers:
            device_type = "proxy"
        else:
            device_type = "server"
        os_name = "Servidor Web"
    elif 53 in port_numbers:
        device_type = "network"
        os_name = "Servidor DNS"
    elif not open_ports:
        device_type = "endpoint"

    # Try hostname resolution
    hostname = None
    try:
        hostname = socket.gethostbyaddr(ip)[0]
        if "router" in hostname.lower() or "gateway" in hostname.lower():
            device_type = "router"
        elif "printer" in hostname.lower() or "hp" in hostname.lower():
            device_type = "printer"
        elif "camera" in hostname.lower() or "cam" in hostname.lower():
            device_type = "iot"
    except socket.herror:
        pass

    return os_name, os_version, device_type, hostname


def assess_vulnerabilities(ip, open_ports, os_name):
    """Avalia vulnerabilidades baseado nas portas e SO detectado."""
    vulns = []

    for port_info in open_ports:
        port = port_info["port"]
        risk = port_info["risk"]

        if risk in ("critical", "high"):
            vulns.append({
                "title": f"Porta {port} ({port_info['service']}) exposta",
                "severity": risk,
                "description": port_info["description"],
                "recommendation": get_recommendation(port)
            })

    # Windows-specific checks
    if os_name == "Windows":
        port_numbers = [p["port"] for p in open_ports]
        if 445 in port_numbers and 139 in port_numbers:
            vulns.append({
                "title": "SMB e NetBIOS expostos simultaneamente",
                "severity": "critical",
                "description": "Combinação perigosa que facilita ataques de ransomware e movimentação lateral",
                "recommendation": "Desabilitar SMBv1, restringir acesso via firewall"
            })
        if 3389 in port_numbers:
            vulns.append({
                "title": "RDP exposto na rede",
                "severity": "high",
                "description": "Remote Desktop Protocol acessível - alvo comum de ataques brute-force",
                "recommendation": "Habilitar NLA, implementar MFA, usar VPN"
            })

    # Too many open ports
    if len(open_ports) > 5:
        vulns.append({
            "title": f"Excesso de portas abertas ({len(open_ports)})",
            "severity": "medium",
            "description": "Muitas portas abertas aumentam a superfície de ataque",
            "recommendation": "Fechar portas não utilizadas, implementar firewall"
        })

    return vulns


def get_recommendation(port):
    """Retorna recomendação para uma porta específica."""
    recs = {
        21: "Substituir FTP por SFTP ou SCP",
        23: "Desativar Telnet imediatamente, usar SSH",
        135: "Bloquear acesso externo ao RPC",
        139: "Desabilitar NetBIOS se não necessário",
        445: "Desabilitar SMBv1, restringir via firewall",
        1433: "Restringir acesso ao SQL Server via firewall",
        3306: "Restringir acesso ao MySQL, usar SSL",
        3389: "Habilitar NLA, usar VPN, implementar MFA",
        5432: "Restringir acesso ao PostgreSQL via pg_hba.conf",
        5900: "Substituir VNC por solução com criptografia",
    }
    return recs.get(port, "Verificar necessidade e restringir acesso")


def calculate_risk_level(vulns, open_ports):
    """Calcula o nível de risco geral do dispositivo."""
    if any(v["severity"] == "critical" for v in vulns):
        return "critical"
    if any(v["severity"] == "high" for v in vulns):
        return "high"
    if any(v["severity"] == "medium" for v in vulns):
        return "medium"
    if len(open_ports) > 3:
        return "medium"
    return "low"


def scan_device(ip):
    """Escaneia um dispositivo completo."""
    print(f"\n[*] Escaneando {ip}...")

    # Scan ports
    open_ports = scan_ports(ip)
    print(f"    Portas abertas: {len(open_ports)}")

    # Detect OS
    os_name, os_version, device_type, hostname = detect_os(ip, open_ports)
    print(f"    SO detectado: {os_name}")
    print(f"    Tipo: {device_type}")
    if hostname:
        print(f"    Hostname: {hostname}")

    # Assess vulnerabilities
    vulns = assess_vulnerabilities(ip, open_ports, os_name)
    risk = calculate_risk_level(vulns, open_ports)

    if vulns:
        print(f"    ⚠ Vulnerabilidades: {len(vulns)} (Risco: {risk.upper()})")
    else:
        print(f"    ✓ Sem vulnerabilidades críticas (Risco: {risk.upper()})")

    return {
        "ip_address": ip,
        "mac_address": None,
        "hostname": hostname,
        "os_detected": os_name,
        "os_version": os_version,
        "device_type": device_type,
        "open_ports": open_ports,
        "vulnerabilities": vulns,
        "risk_level": risk,
        "status": "online"
    }


def send_results(company_name, scan_id, network_range, devices):
    """Envia resultados para o SafeScore."""
    print(f"\n[*] Enviando {len(devices)} dispositivos para SafeScore...")

    payload = {
        "company_name": company_name,
        "scan_id": scan_id,
        "agent_version": AGENT_VERSION,
        "network_range": network_range,
        "devices": devices
    }

    try:
        resp = requests.post(
            SAFESCORE_API,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"[✓] Dados enviados com sucesso!")
            print(f"    Network Scan ID: {data.get('network_scan_id')}")
            print(f"    Dispositivos registrados: {data.get('devices_count')}")
            return True
        else:
            print(f"[✗] Erro ao enviar: {resp.status_code} - {resp.text}")
            return False
    except Exception as e:
        print(f"[✗] Erro de conexão: {e}")
        return False


def save_local_report(devices, company_name, network_range):
    """Salva relatório local em JSON."""
    report = {
        "agent_version": AGENT_VERSION,
        "company_name": company_name,
        "network_range": network_range,
        "scan_date": datetime.now().isoformat(),
        "total_devices": len(devices),
        "devices": devices,
        "summary": {
            "critical": sum(1 for d in devices if d["risk_level"] == "critical"),
            "high": sum(1 for d in devices if d["risk_level"] == "high"),
            "medium": sum(1 for d in devices if d["risk_level"] == "medium"),
            "low": sum(1 for d in devices if d["risk_level"] == "low"),
        }
    }

    filename = f"safescore_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n[*] Relatório salvo: {filename}")
    return filename


def main():
    parser = argparse.ArgumentParser(description="SafeScore Network Agent")
    parser.add_argument("--company", required=True, help="Nome da empresa")
    parser.add_argument("--range", help="Range de rede (ex: 192.168.1.0/24)")
    parser.add_argument("--scan-id", help="ID do scan no SafeScore (opcional)")
    parser.add_argument("--no-send", action="store_true", help="Não enviar para SafeScore")
    parser.add_argument("--fast", action="store_true", help="Scan rápido (apenas ARP)")
    args = parser.parse_args()

    print_banner()

    local_ip = get_local_ip()
    print(f"[*] IP Local: {local_ip}")

    network_range = args.range or detect_network_range(local_ip)
    print(f"[*] Range de rede: {network_range}")
    print(f"[*] Empresa: {args.company}")
    print(f"[*] Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")

    # Discover hosts
    if args.fast:
        print("\n[*] Modo rápido: usando tabela ARP")
        hosts = discover_hosts_arp()
        if not hosts:
            print("[!] ARP vazio, usando ping sweep...")
            hosts = discover_hosts_ping(network_range)
    else:
        # Try ARP first, then ping sweep for remaining
        arp_hosts = discover_hosts_arp()
        if arp_hosts:
            print(f"[*] {len(arp_hosts)} hosts via ARP")
        ping_hosts = discover_hosts_ping(network_range)
        hosts = list(set(arp_hosts + ping_hosts))

    if not hosts:
        print("\n[!] Nenhum host encontrado na rede")
        sys.exit(1)

    print(f"\n{'='*50}")
    print(f"[*] Total de hosts a escanear: {len(hosts)}")
    print(f"{'='*50}")

    # Scan each device
    devices = []
    for i, ip in enumerate(hosts):
        print(f"\n--- Dispositivo {i+1}/{len(hosts)} ---")
        device = scan_device(ip)
        devices.append(device)

    # Summary
    print(f"\n{'='*50}")
    print(f"         RESUMO DO ESCANEAMENTO")
    print(f"{'='*50}")
    print(f"  Dispositivos encontrados: {len(devices)}")
    print(f"  Risco Crítico: {sum(1 for d in devices if d['risk_level'] == 'critical')}")
    print(f"  Risco Alto:    {sum(1 for d in devices if d['risk_level'] == 'high')}")
    print(f"  Risco Médio:   {sum(1 for d in devices if d['risk_level'] == 'medium')}")
    print(f"  Risco Baixo:   {sum(1 for d in devices if d['risk_level'] == 'low')}")
    print(f"{'='*50}")

    # Save local report
    save_local_report(devices, args.company, network_range)

    # Send to SafeScore
    if not args.no_send:
        send_results(args.company, args.scan_id, network_range, devices)
    else:
        print("\n[*] Modo offline - dados não enviados ao SafeScore")

    print("\n[✓] Escaneamento concluído!")


if __name__ == "__main__":
    main()
