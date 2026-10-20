"""Causal graph and blast radius tables

Revision ID: 003_causal_graph_and_blast_radius
Revises: 002_executable_experiments
Create Date: 2026-10-20 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_causal_graph_and_blast_radius'
down_revision: Union[str, None] = '002_executable_experiments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create causal_nodes table
    op.create_table(
        'causal_nodes',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('release_id', sa.String(length=64), sa.ForeignKey('releases.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('experiment_id', sa.String(length=64), sa.ForeignKey('experiments.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('node_type', sa.String(length=64), nullable=False, index=True),
        sa.Column('label', sa.String(length=128), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(length=32), nullable=False, server_default='normal'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='active'),
        sa.Column('provenance_type', sa.String(length=64), nullable=False, server_default='unknown'),
        sa.Column('provenance_id', sa.String(length=128), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )

    # 2. Create causal_edges table
    op.create_table(
        'causal_edges',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('release_id', sa.String(length=64), sa.ForeignKey('releases.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('source_node_id', sa.String(length=64), sa.ForeignKey('causal_nodes.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('target_node_id', sa.String(length=64), sa.ForeignKey('causal_nodes.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('relation_type', sa.String(length=64), nullable=False),
        sa.Column('classification', sa.String(length=32), nullable=False, server_default='INFERRED', index=True),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('evidence_id', sa.String(length=64), sa.ForeignKey('evidences.id', ondelete='SET NULL'), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('is_active_in_variant', sa.String(length=32), nullable=False, server_default='both'),
        sa.Column('metadata_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )

    # 3. Create blast_radius_reports table
    op.create_table(
        'blast_radius_reports',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('release_id', sa.String(length=64), sa.ForeignKey('releases.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('experiment_id', sa.String(length=64), sa.ForeignKey('experiments.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('scenario_id', sa.String(length=64), nullable=True),
        sa.Column('severity', sa.String(length=32), nullable=False, server_default='HIGH'),
        sa.Column('directly_affected_services', sa.JSON(), nullable=False),
        sa.Column('downstream_affected_services', sa.JSON(), nullable=False),
        sa.Column('violated_invariants', sa.JSON(), nullable=False),
        sa.Column('affected_transaction_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('financial_exposure_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('financial_exposure_usd', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('mitigated_in_repaired', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('counterfactual_delta', sa.JSON(), nullable=False),
        sa.Column('confidence_basis', sa.String(length=128), nullable=False),
        sa.Column('assumptions', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )


def downgrade() -> None:
    op.drop_table('blast_radius_reports')
    op.drop_table('causal_edges')
    op.drop_table('causal_nodes')
