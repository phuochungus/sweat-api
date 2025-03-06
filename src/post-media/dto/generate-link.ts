import { ApiProperty } from '@nestjs/swagger';

export class GenerateUploadLink {
  @ApiProperty({ example: [{ mimetype: 'image/png', ext: 'png' }] })
  files: [
    {
      mimetype: string;
      ext: string;
    },
  ];
}
