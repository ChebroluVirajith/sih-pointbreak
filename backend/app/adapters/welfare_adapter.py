import asyncio
from typing import Optional, Dict, Any

# Mock Legacy SOAP / XML System Responses
LEGACY_SOAP_RESPONSES = {
    "WEL-RATION-441": """<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:welf="http://welfare.gov.in/ws/registry">
   <soapenv:Header>
      <welf:SecurityToken>SEC-SOAP-99882-VERIFIED</welf:SecurityToken>
   </soapenv:Header>
   <soapenv:Body>
      <welf:GetBeneficiaryResponse>
         <welf:BeneficiaryRecord>
            <welf:RationCardId>WEL-RATION-441</welf:RationCardId>
            <welf:HeadOfFamilyName>Challa Virajith</welf:HeadOfFamilyName>
            <welf:EconomicSocioCategory>BPL</welf:EconomicSocioCategory>
            <welf:AnnualCertifiedIncomeINR>180000.00</welf:AnnualCertifiedIncomeINR>
            <welf:ActiveDBTSubsidiesFlag>true</welf:ActiveDBTSubsidiesFlag>
            <welf:RegistryStateCode>KA-29</welf:RegistryStateCode>
            <welf:LastDisbursementDate>2026-08-15</welf:LastDisbursementDate>
         </welf:BeneficiaryRecord>
      </welf:GetBeneficiaryResponse>
   </soapenv:Body>
</soapenv:Envelope>""",

    "WEL-RATION-809": """<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:welf="http://welfare.gov.in/ws/registry">
   <soapenv:Header>
      <welf:SecurityToken>SEC-SOAP-77123-VERIFIED</welf:SecurityToken>
   </soapenv:Header>
   <soapenv:Body>
      <welf:GetBeneficiaryResponse>
         <welf:BeneficiaryRecord>
            <welf:RationCardId>WEL-RATION-809</welf:RationCardId>
            <welf:HeadOfFamilyName>Priya Sharma</welf:HeadOfFamilyName>
            <welf:EconomicSocioCategory>EWS</welf:EconomicSocioCategory>
            <welf:AnnualCertifiedIncomeINR>240000.00</welf:AnnualCertifiedIncomeINR>
            <welf:ActiveDBTSubsidiesFlag>false</welf:ActiveDBTSubsidiesFlag>
            <welf:RegistryStateCode>MH-12</welf:RegistryStateCode>
            <welf:LastDisbursementDate>2026-07-20</welf:LastDisbursementDate>
         </welf:BeneficiaryRecord>
      </welf:GetBeneficiaryResponse>
   </soapenv:Body>
</soapenv:Envelope>"""
}

class WelfareAdapter:
    """
    Connects to Legacy Government Welfare & Social Security SOAP/WSDL/XML service.
    Simulates legacy network protocol, XML SOAP envelope fetching, and legacy latency.
    """
    def __init__(self):
        self.system_id = "Legacy-SOAP-XML-WelfareRegistry"
        self.health_status = "HEALTHY"
        self.endpoint_url = "https://legacy-welfare.gov.internal/services/BeneficiaryRegistryService.svc"

    async def fetch_welfare_soap_xml(self, dept_local_id: str) -> Optional[Dict[str, Any]]:
        # Simulate legacy SOAP web service latency
        await asyncio.sleep(0.08)
        raw_xml = LEGACY_SOAP_RESPONSES.get(dept_local_id)
        if not raw_xml:
            return None
        
        return {
            "source_type": "SOAP_1_2_XML_ENVELOPE",
            "endpoint": self.endpoint_url,
            "raw_xml": raw_xml
        }

    async def health_check(self) -> Dict[str, Any]:
        return {
            "adapter": "WelfareAdapter",
            "backend": "Legacy SOAP/XML Welfare Registry (WSDL 2.0)",
            "status": "ONLINE",
            "latency_ms": 38,
            "records_indexed": len(LEGACY_SOAP_RESPONSES)
        }

welfare_adapter = WelfareAdapter()
