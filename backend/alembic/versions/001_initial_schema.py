"""Initial schema for AFTERMATH domain models

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-20 17:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. releases
    op.create_table(
        'releases',
        sa.Column('id', sa.String(length=64), primary_key=True, index=True),
        sa.Column('version_tag', sa.String(length=32), nullable=False, index=True),
        sa.Column('commit_hash', sa.String(length=64), nullable=False, index=True),
        sa.Column('branch', sa.String(length=128), nullable=False),
        sa.Column('author', sa.String(length=128), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='investigating'),
        sa.Column('diff_stats', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # 2. experiments
    op.create_table(
        'experiments',
        sa.Column('id', sa.String(length=64), primary_key=True, index=True),
        sa.Column('release_id', sa.String(length=64), sa.ForeignKey('releases.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('variant', sa.String(length=32), nullable=False, index=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='completed'),
        sa.Column('duration_seconds', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('error_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('transaction_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('p95_latency_ms', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('anomaly_detected', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('metrics_summary', sa.JSON(), nullable=True),
        sa.Column('gitlab_job_id', sa.String(length=64), nullable=True),
        sa.Column('gitlab_pipeline_id', sa.String(length=64), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
    )

    # 3. experiment_events
    op.create_table(
        'experiment_events',
        sa.Column('id', sa.String(length=64), primary_key=True, index=True),
        sa.Column('experiment_id', sa.String(length=64), sa.ForeignKey('experiments.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('timestamp_offset_ms', sa.Integer(), nullable=False, index=True),
        sa.Column('service_name', sa.String(length=64), nullable=False),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('level', sa.String(length=16), nullable=False, server_default='info'),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('latency_ms', sa.Float(), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),
    )

    # 4. evidences
    op.create_table(
        'evidences',
        sa.Column('id', sa.String(length=64), primary_key=True, index=True),
        sa.Column('experiment_id', sa.String(length=64), sa.ForeignKey('experiments.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.String(length=128), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('severity', sa.String(length=16), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('raw_log_excerpt', sa.Text(), nullable=True),
        sa.Column('gitlab_artifact_url', sa.String(length=256), nullable=True),
        sa.Column('verified', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    # 5. agent_sessions
    op.create_table(
        'agent_sessions',
        sa.Column('id', sa.String(length=64), primary_key=True, index=True),
        sa.Column('release_id', sa.String(length=64), sa.ForeignKey('releases.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('agent_name', sa.String(length=128), nullable=False),
        sa.Column('agent_role', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='completed'),
        sa.Column('goal', sa.Text(), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('tools_invoked', sa.JSON(), nullable=True),
        sa.Column('gitlab_duo_session_id', sa.String(length=128), nullable=True),
        sa.Column('gitlab_flow_name', sa.String(length=128), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
    )

    # 6. approvals
    op.create_table(
        'approvals',
        sa.Column('id', sa.String(length=64), primary_key=True, index=True),
        sa.Column('release_id', sa.String(length=64), sa.ForeignKey('releases.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('gate_name', sa.String(length=128), nullable=False),
        sa.Column('gate_type', sa.String(length=32), nullable=False, server_default='automated'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='pending'),
        sa.Column('approver_name', sa.String(length=128), nullable=True),
        sa.Column('approver_email', sa.String(length=128), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('required', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('signed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    # 7. audit_events
    op.create_table(
        'audit_events',
        sa.Column('id', sa.String(length=64), primary_key=True, index=True),
        sa.Column('entity_type', sa.String(length=64), nullable=False, index=True),
        sa.Column('entity_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('actor', sa.String(length=128), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, index=True),
    )

    # 8. synthetic_transactions
    op.create_table(
        'synthetic_transactions',
        sa.Column('id', sa.String(length=64), primary_key=True, index=True),
        sa.Column('transaction_ref', sa.String(length=64), nullable=False, unique=True, index=True),
        sa.Column('idempotency_key', sa.String(length=128), nullable=True, index=True),
        sa.Column('customer_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='USD'),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('latency_ms', sa.Float(), nullable=False, server_default='45.0'),
        sa.Column('is_duplicate', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('has_anomaly', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('error_detail', sa.String(length=256), nullable=True),
        sa.Column('release_variant', sa.String(length=32), nullable=False),
        sa.Column('metadata_payload', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('synthetic_transactions')
    op.drop_table('audit_events')
    op.drop_table('approvals')
    op.drop_table('agent_sessions')
    op.drop_table('evidences')
    op.drop_table('experiment_events')
    op.drop_table('experiments')
    op.drop_table('releases')
