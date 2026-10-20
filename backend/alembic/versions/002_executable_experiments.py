"""Executable experiments and durable idempotency table

Revision ID: 002_executable_experiments
Revises: 001_initial_schema
Create Date: 2026-10-20 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_executable_experiments'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add columns to experiments
    with op.batch_alter_table('experiments') as batch_op:
        batch_op.add_column(sa.Column('scenario_id', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('scenario_config', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('reproducibility_seed', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('invariant_status', sa.String(length=16), nullable=True))
        batch_op.add_column(sa.Column('invariant_verdict', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('ledger_summary', sa.JSON(), nullable=True))

    # 2. Add columns to synthetic_transactions
    with op.batch_alter_table('synthetic_transactions') as batch_op:
        batch_op.add_column(sa.Column('experiment_id', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('order_id', sa.String(length=64), nullable=True))

    # 3. Create idempotency_records table
    op.create_table(
        'idempotency_records',
        sa.Column('id', sa.String(length=64), primary_key=True, index=True),
        sa.Column('experiment_id', sa.String(length=64), sa.ForeignKey('experiments.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('scope', sa.String(length=64), nullable=False, server_default='checkout_payment'),
        sa.Column('idempotency_key', sa.String(length=128), nullable=False, index=True),
        sa.Column('order_id', sa.String(length=64), nullable=False, index=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='IN_FLIGHT'),
        sa.Column('response_payload', sa.JSON(), nullable=True),
        sa.Column('locked_at', sa.DateTime(), nullable=False),
        sa.Column('lease_expires_at', sa.DateTime(), nullable=False),
        sa.Column('settled_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.UniqueConstraint('experiment_id', 'scope', 'idempotency_key', name='uq_experiment_idempotency_key')
    )


def downgrade() -> None:
    op.drop_table('idempotency_records')
    with op.batch_alter_table('synthetic_transactions') as batch_op:
        batch_op.drop_column('order_id')
        batch_op.drop_column('experiment_id')
    with op.batch_alter_table('experiments') as batch_op:
        batch_op.drop_column('ledger_summary')
        batch_op.drop_column('invariant_verdict')
        batch_op.drop_column('invariant_status')
        batch_op.drop_column('reproducibility_seed')
        batch_op.drop_column('scenario_config')
        batch_op.drop_column('scenario_id')
