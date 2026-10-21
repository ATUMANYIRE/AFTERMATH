"""Remediation workflows table

Revision ID: 004_remediation_workflows
Revises: 003_causal_graph_and_blast_radius
Create Date: 2026-10-21 06:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004_remediation_workflows'
down_revision: Union[str, None] = '003_causal_graph_and_blast_radius'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'remediation_workflows',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('release_id', sa.String(length=64), sa.ForeignKey('releases.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('triggering_experiment_id', sa.String(length=64), sa.ForeignKey('experiments.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('violated_invariant', sa.String(length=128), nullable=False, server_default='INV-PAY-001: Exactly-One-Charge-Per-Purchase'),
        sa.Column('causal_node_id', sa.String(length=64), nullable=True),
        sa.Column('source_commit', sa.String(length=64), nullable=False),
        sa.Column('target_file_path', sa.String(length=255), nullable=False),
        sa.Column('patch_diff', sa.Text(), nullable=True),
        sa.Column('patch_hash', sa.String(length=64), nullable=True),
        sa.Column('changed_files', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='DETECTED', index=True),
        sa.Column('agent_provider', sa.String(length=64), nullable=False, server_default='reference_remediation_engine'),
        sa.Column('agent_model', sa.String(length=64), nullable=True),
        sa.Column('tool_execution_records', sa.JSON(), nullable=False),
        sa.Column('validation_results', sa.JSON(), nullable=False),
        sa.Column('approval_status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('approval_decision', sa.JSON(), nullable=True),
        sa.Column('remediation_branch', sa.String(length=128), nullable=True),
        sa.Column('gitlab_mr_url', sa.String(length=255), nullable=True),
        sa.Column('gitlab_mr_status', sa.String(length=32), nullable=False, server_default='BLOCKED'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    op.drop_table('remediation_workflows')
