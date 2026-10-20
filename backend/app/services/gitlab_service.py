"""
GitLab DevSecOps & Duo Agent Platform Integration Service.
Provides authentic interactions with GitLab REST APIs and Duo Agent Platform endpoints when configured.
Strictly avoids artificial mock data when credentials are not supplied.
"""
from typing import Optional, Dict, Any
import httpx
from app.config import settings


class GitLabService:
    def __init__(self):
        self.instance_url = settings.GITLAB_INSTANCE_URL.rstrip("/")
        self.project_path = settings.GITLAB_PROJECT_PATH
        self.token = settings.GITLAB_ACCESS_TOKEN
        self.enabled = settings.GITLAB_DUO_ENABLED and bool(self.token)

    async def get_project_status(self) -> Dict[str, Any]:
        """
        Queries official GitLab API for project metadata if token is configured.
        """
        if not self.enabled:
            return {
                "connected": False,
                "project_path": self.project_path,
                "instance_url": self.instance_url,
                "reason": "GITLAB_ACCESS_TOKEN not configured or GITLAB_DUO_ENABLED is false",
            }

        headers = {"PRIVATE-TOKEN": self.token}
        encoded_path = self.project_path.replace("/", "%2F")
        url = f"{self.instance_url}/api/v4/projects/{encoded_path}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "connected": True,
                        "project_id": data.get("id"),
                        "name": data.get("name"),
                        "visibility": data.get("visibility"),
                        "web_url": data.get("web_url"),
                        "default_branch": data.get("default_branch"),
                    }
                else:
                    return {
                        "connected": False,
                        "status_code": res.status_code,
                        "reason": f"GitLab API returned status {res.status_code}: {res.text[:150]}",
                    }
        except Exception as e:
            return {
                "connected": False,
                "reason": f"Connection error reaching GitLab instance: {str(e)}",
            }

    def generate_grounded_summary(self, release_id: str, evidences: list) -> str:
        """
        Synthesizes an evidence-grounded summary from actual database evidence items.
        """
        if not evidences:
            return f"Analysis complete for {release_id}: No critical invariants breached."

        crit_count = sum(1 for e in evidences if getattr(e, "severity", "") == "critical")
        summary_lines = [
            f"Consequence Auditor Assessment for release {release_id}:",
            f"- Identified {len(evidences)} verified empirical findings ({crit_count} critical severity).",
        ]
        for e in evidences[:3]:
            summary_lines.append(f"  * [{e.severity.upper()}] {e.title}: {e.summary}")

        return "\n".join(summary_lines)


gitlab_service = GitLabService()
