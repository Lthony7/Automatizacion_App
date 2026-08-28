/**
 * FASE 15: Vertical Metadata endpoint.
 * GET /api/verticals/:id/metadata — backend provides navigation + dashboard config.
 * The frontend must NOT hardcode nav; it fetches from here.
 */
import { Controller, Get, Param } from '@nestjs/common'
import { getVerticalMetadata, listVerticalIds } from 'domain-contracts'

@Controller('api/verticals')
export class VerticalsController {
  @Get(':id/metadata')
  getMetadata(@Param('id') id: string) {
    return getVerticalMetadata(id)
  }

  @Get()
  list() {
    return listVerticalIds()
  }
}
