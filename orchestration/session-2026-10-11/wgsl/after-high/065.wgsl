// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform0_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform0 : texture_2d<f32>;
@binding( 4 ) @group( 1 ) var nodeUniform9_sampler : sampler;
@binding( 5 ) @group( 1 ) var nodeUniform9 : texture_2d<f32>;
@binding( 6 ) @group( 1 ) var nodeUniform22_sampler : sampler_comparison;
@binding( 7 ) @group( 1 ) var nodeUniform22 : texture_depth_2d;

struct NodeBuffer_11649Struct {
	value : array< vec4<f32>, 7 >
};
@binding( 3 ) @group( 1 )
var<uniform> NodeBuffer_11649 : NodeBuffer_11649Struct;

struct objectStruct {
	nodeUniform1 : f32,
	nodeUniform2 : f32,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform6 : mat4x4<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform34 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	nodeUniform8 : f32,
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform28 : f32,
	nodeUniform29 : f32,
	nodeUniform13 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform19 : mat4x4<f32>,
	nodeUniform20 : f32,
	nodeUniform21 : f32,
	nodeUniform25 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform23 : f32,
	nodeUniform24 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : u32;
var<private> nodeVar2 : u32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : u32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : u32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : u32;
var<private> nodeVar20 : u32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : vec3<f32>;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : vec2<f32>;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : vec3<f32>;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : vec2<f32>;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : vec2<f32>;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec2<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : f32;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : vec2<f32>;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : f32;
var<private> nodeVar48 : f32;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : vec2<f32>;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : f32;
var<private> nodeVar61 : vec2<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : vec3<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar68 : vec3<f32>;
var<private> NORMAL_nodeVar69 : f32;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : vec2<f32>;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : vec2<f32>;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar96 : f32;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec4<f32>;
var<private> nodeVar103 : vec4<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : f32;
var<private> nodeVar115 : f32;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : f32;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec4<f32>;
var<private> nodeVar131 : vec4<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar135 : f32;
var<private> nodeVar136 : vec4<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : f32;
var<private> nodeVar140 : f32;
var<private> nodeVar141 : vec2<f32>;
var<private> nodeVar142 : f32;
var<private> nodeVar143 : vec2<f32>;
var<private> nodeVar144 : f32;
var<private> nodeVar145 : vec2<f32>;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : vec2<f32>;
var<private> nodeVar148 : f32;
var<private> nodeVar149 : vec2<f32>;
var<private> nodeVar150 : f32;
var<private> nodeVar151 : f32;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : f32;
var<private> nodeVar160 : f32;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : f32;
var<private> nodeVar168 : f32;
var<private> nodeVar169 : f32;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : f32;
var<private> nodeVar177 : f32;
var<private> nodeVar178 : f32;
var<private> nodeVar179 : f32;
var<private> nodeVar180 : f32;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : f32;
var<private> nodeVar189 : f32;
var<private> nodeVar190 : f32;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : f32;
var<private> nodeVar198 : f32;
var<private> nodeVar199 : f32;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : f32;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : f32;
var<private> nodeVar217 : f32;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : f32;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : vec3<f32>;
var<private> nodeVar238 : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : f32;
var<private> nodeVar244 : vec3<f32>;
var<private> nodeVar245 : vec3<f32>;
var<private> nodeVar246 : vec3<f32>;
var<private> nodeVar247 : vec3<f32>;
var<private> nodeVar248 : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> nodeVar251 : f32;
var<private> nodeVar252 : vec3<f32>;
var<private> nodeVar253 : vec3<f32>;
var<private> nodeVar254 : vec3<f32>;
var<private> nodeVar255 : vec3<f32>;
var<private> nodeVar256 : vec3<f32>;
var<private> nodeVar257 : vec3<f32>;
var<private> nodeVar258 : vec3<f32>;
var<private> nodeVar259 : f32;
var<private> nodeVar260 : f32;
var<private> nodeVar261 : f32;
var<private> nodeVar262 : vec3<f32>;
var<private> nodeVar263 : vec3<f32>;
var<private> nodeVar264 : vec3<f32>;
var<private> nodeVar265 : vec3<f32>;
var<private> nodeVar266 : vec3<f32>;
var<private> nodeVar267 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar268 : vec3<f32>;
var<private> nodeVar269 : vec3<f32>;
var<private> nodeVar270 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar271 : vec3<f32>;
var<private> nodeVar272 : vec3<f32>;
var<private> nodeVar273 : vec3<f32>;
var<private> nodeVar274 : vec3<f32>;
var<private> nodeVar275 : vec3<f32>;
var<private> nodeVar276 : vec3<f32>;
var<private> nodeVar277 : vec3<f32>;
var<private> nodeVar278 : vec3<f32>;
var<private> nodeVar279 : vec3<f32>;
var<private> nodeVar280 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar281 : vec3<f32>;
var<private> nodeVar282 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar283 : vec3<f32>;
var<private> nodeVar284 : f32;
var<private> nodeVar285 : f32;
var<private> nodeVar286 : f32;
var<private> nodeVar287 : f32;
var<private> nodeVar288 : f32;
var<private> nodeVar289 : f32;
var<private> nodeVar290 : f32;
var<private> nodeVar291 : f32;
var<private> nodeVar292 : f32;
var<private> nodeVar293 : f32;
var<private> nodeVar294 : f32;
var<private> nodeVar295 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar296 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar297 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar298 : vec3<f32>;
var<private> nodeVar299 : f32;
var<private> nodeVar300 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_normalViewGeometry : vec3<f32>,
	@location( 2 ) v_positionWorld : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec3<f32>,
	@location( 5 ) nodeVarying8 : vec2<f32>,
	@location( 6 ) nodeVarying9 : vec2<f32>,
	@location( 7 ) nodeVarying10 : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = floor( ( nodeVarying8.y / 0.72 ) );
	nodeVar1 = ( ( u32( ( nodeVar0 + 2.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar2 = ( ( ( nodeVar1 >> ( ( nodeVar1 >> 28u ) + 4u ) ) ^ nodeVar1 ) * 277803737u );
	nodeVar3 = ( ( ( f32( ( ( nodeVar2 >> 22u ) ^ nodeVar2 ) ) * 2.3283064365386963e-10 ) * 0.2 ) + 0.28 );
	nodeVar4 = ( nodeVarying8.y - ( nodeVar0 * 0.72 ) );
	nodeVar5 = step( nodeVar3, nodeVar4 );
	nodeVar6 = ( ( nodeVar0 * 2.0 ) + nodeVar5 );
	nodeVar7 = ( ( u32( ( nodeVar6 + 11.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = step( 0.5, nodeVarying9.y );
	nodeVar10 = mix( ( ( ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ) * 0.75 ) + 0.62 ), nodeVarying9.x, nodeVar9 );
	nodeVar11 = ( ( u32( ( nodeVar6 + 5.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar12 = ( ( ( nodeVar11 >> ( ( nodeVar11 >> 28u ) + 4u ) ) ^ nodeVar11 ) * 277803737u );
	nodeVar13 = ( ( nodeVarying8.x / nodeVar10 ) + ( ( tsl_mod_float( nodeVar6, 2.0 ) * 0.5 ) + floor( ( ( f32( ( ( nodeVar12 >> 22u ) ^ nodeVar12 ) ) * 2.3283064365386963e-10 ) * 8.0 ) ) ) );
	nodeVar14 = floor( nodeVar13 );
	nodeVar15 = ( mix( nodeVar14, tsl_mod_float( nodeVar14, max( nodeVarying9.y, 1.0 ) ), nodeVar9 ) + ( nodeVar6 * 57.3 ) );
	nodeVar16 = ( ( u32( ( nodeVar15 + 19.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar17 = ( ( ( nodeVar16 >> ( ( nodeVar16 >> 28u ) + 4u ) ) ^ nodeVar16 ) * 277803737u );
	nodeVar18 = ( ( f32( ( ( nodeVar17 >> 22u ) ^ nodeVar17 ) ) * 2.3283064365386963e-10 ) - 0.5 );
	nodeVar19 = ( ( u32( nodeVar15 ) * 747796405u ) + 2891336453u );
	nodeVar20 = ( ( ( nodeVar19 >> ( ( nodeVar19 >> 28u ) + 4u ) ) ^ nodeVar19 ) * 277803737u );
	nodeVar21 = ( ( ( f32( ( ( nodeVar20 >> 22u ) ^ nodeVar20 ) ) * 2.3283064365386963e-10 ) * 0.62 ) + 0.66 );
	nodeVar22 = vec3<f32>( ( nodeVarying8.x * 6.3 ), ( nodeVarying8.y * 6.3 ), ( nodeVar15 * 0.37 ) );
	nodeVar23 = fract( ( nodeVar22 / vec3<f32>( 8.0 ) ) );
	nodeVar24 = ( nodeVar23.z * 64.0 );
	nodeVar25 = floor( nodeVar24 );
	nodeVar26 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar25, 8.0 ), floor( ( nodeVar25 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar23.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar27 = mix( nodeVar26.x, nodeVar26.y, ( nodeVar24 - nodeVar25 ) );
	nodeVar28 = fract( ( vec3<f32>( ( nodeVarying8.x * 21.0 ), ( nodeVarying8.y * 21.0 ), nodeVar15 ) / vec3<f32>( 8.0 ) ) );
	nodeVar29 = ( nodeVar28.z * 64.0 );
	nodeVar30 = floor( nodeVar29 );
	nodeVar31 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar30, 8.0 ), floor( ( nodeVar30 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar28.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar32 = fract( ( ( nodeVar22 * vec3<f32>( 2.6 ) ) / vec3<f32>( 8.0 ) ) );
	nodeVar33 = ( nodeVar32.z * 64.0 );
	nodeVar34 = floor( nodeVar33 );
	nodeVar35 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar34, 8.0 ), floor( ( nodeVar34 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar32.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar36 = smoothstep( 0.4, 0.7, mix( nodeVar35.x, nodeVar35.y, ( nodeVar33 - nodeVar34 ) ) );
	nodeVar37 = fract( ( vec3<f32>( ( nodeVarying8.x * 0.85 ), ( nodeVarying8.y * 0.16 ), 3.3 ) / vec3<f32>( 8.0 ) ) );
	nodeVar38 = ( nodeVar37.z * 64.0 );
	nodeVar39 = floor( nodeVar38 );
	nodeVar40 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar39, 8.0 ), floor( ( nodeVar39 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar37.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar41 = fract( ( vec3<f32>( ( nodeVarying8.x * 0.5 ), ( nodeVarying8.y * 0.45 ), 8.2 ) / vec3<f32>( 8.0 ) ) );
	nodeVar42 = ( nodeVar41.z * 64.0 );
	nodeVar43 = floor( nodeVar42 );
	nodeVar44 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar43, 8.0 ), floor( ( nodeVar43 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar41.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar45 = mix( nodeVar44.x, nodeVar44.y, ( nodeVar42 - nodeVar43 ) );
	nodeVar46 = fract( nodeVar13 );
	nodeVar47 = mix( nodeVar3, ( 0.72 - nodeVar3 ), nodeVar5 );
	nodeVar48 = ( ( nodeVar4 - ( nodeVar5 * nodeVar3 ) ) / nodeVar47 );
	nodeVar49 = fract( ( vec3<f32>( ( nodeVarying8.x * 7.1 ), ( nodeVarying8.y * 7.1 ), 1.7 ) / vec3<f32>( 8.0 ) ) );
	nodeVar50 = ( nodeVar49.z * 64.0 );
	nodeVar51 = floor( nodeVar50 );
	nodeVar52 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar51, 8.0 ), floor( ( nodeVar51 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar49.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar53 = ( min( ( min( nodeVar46, ( 1.0 - nodeVar46 ) ) * nodeVar10 ), ( min( nodeVar48, ( 1.0 - nodeVar48 ) ) * nodeVar47 ) ) + ( mix( nodeVar52.x, nodeVar52.y, ( nodeVar50 - nodeVar51 ) ) * 0.011 ) );
	nodeVar54 = max( fwidth( nodeVarying8.x ), fwidth( nodeVarying8.y ) );
	nodeVar55 = ( ( nodeVar54 * 0.75 ) + 0.0015 );
	nodeVar56 = mix( ( 1.0 - smoothstep( ( 0.024 - nodeVar55 ), ( 0.024 + nodeVar55 ), nodeVar53 ) ), 0.17, smoothstep( 0.1, 0.34, nodeVar54 ) );
	nodeVar57 = smoothstep( 1.7, 0.0, ( ( nodeVarying10.z + ( nodeVar27 * 0.35 ) ) + ( nodeVar45 * 0.4 ) ) );
	nodeVar58 = fract( ( vec3<f32>( ( nodeVarying8.x * 2.4 ), ( nodeVarying8.y * 2.4 ), 9.1 ) / vec3<f32>( 8.0 ) ) );
	nodeVar59 = ( nodeVar58.z * 64.0 );
	nodeVar60 = floor( nodeVar59 );
	nodeVar61 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar60, 8.0 ), floor( ( nodeVar60 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar58.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar62 = mix( ( ( nodeVarying7 * vec3<f32>( ( 1.0 + ( nodeVar18 * 0.12 ) ), ( 1.0 - ( nodeVar18 * 0.02 ) ), ( 1.0 - ( nodeVar18 * 0.14 ) ) ) ) * vec3<f32>( max( ( ( ( ( ( ( ( ( ( ( nodeVar21 + ( nodeVar27 * 0.11 ) ) + ( mix( nodeVar31.x, nodeVar31.y, ( nodeVar29 - nodeVar30 ) ) * 0.07 ) ) + ( nodeVar36 * 0.07 ) ) + ( mix( nodeVar40.x, nodeVar40.y, ( nodeVar38 - nodeVar39 ) ) * 0.1 ) ) + ( nodeVar45 * 0.12 ) ) + ( smoothstep( 0.32, 0.0, ( min( nodeVarying10.x, nodeVarying10.y ) + ( nodeVar27 * 0.08 ) ) ) * 0.16 ) ) + ( ( smoothstep( 0.08, 0.035, nodeVar53 ) * ( 1.0 - nodeVar56 ) ) * 0.1 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar53 ) * 0.16 ) + 0.84 ) ) * ( 1.0 - ( nodeVar57 * 0.4 ) ) ) * ( 1.0 - ( nodeVar56 * 0.65 ) ) ), 0.0 ) ) ), ( vec3<f32>( 0.07, 0.09, 0.03 ) * vec3<f32>( nodeVar21 ) ), ( ( ( ( nodeVar57 * smoothstep( 0.0, 0.55, ( mix( nodeVar61.x, nodeVar61.y, ( nodeVar59 - nodeVar60 ) ) + 0.15 ) ) ) * smoothstep( 1.1, 0.0, nodeVarying10.z ) ) * ( 1.0 - nodeVar56 ) ) * 0.6 ) );
	DiffuseColor = vec4<f32>( nodeVar62, 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform1 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform2;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar63 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 0.93, 0.5, ( nodeVar57 * 0.75 ) ), 0.0525 ) + max( max( nodeVar63.x, nodeVar63.y ), nodeVar63.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform2 ) ) );
	nodeVar64 = ( NodeBuffer_11649.value[ 0u ].xyz - v_positionWorld );
	nodeVar65 = dot( nodeVar64, nodeVar64 );
	nodeVar66 = dpdx( v_positionView );
	nodeVar67 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar68 = cross( nodeVar67, NORMAL_normalView );
	NORMAL_nodeVar69 = dot( nodeVar66, NORMAL_nodeVar68 );
	nodeVar70 = fract( ( vec3<f32>( ( nodeVarying8.x * 13.0 ), ( nodeVarying8.y * 13.0 ), nodeVar6 ) / vec3<f32>( 8.0 ) ) );
	nodeVar71 = ( nodeVar70.z * 64.0 );
	nodeVar72 = floor( nodeVar71 );
	nodeVar73 = textureSample( nodeUniform0, nodeUniform0_sampler, ( ( ( ( vec2<f32>( tsl_mod_float( nodeVar72, 8.0 ), floor( ( nodeVar72 / 8.0 ) ) ) * vec2<f32>( 66.0 ) ) + ( nodeVar70.xy * vec2<f32>( 64.0 ) ) ) + vec2<f32>( 1.5 ) ) / vec2<f32>( 528.0 ) ) ).xy;
	nodeVar74 = ( ( ( ( ( smoothstep( 0.0, 0.07, nodeVar53 ) * 0.014 ) + ( smoothstep( 0.0, 0.02, nodeVar53 ) * 0.006 ) ) + ( mix( nodeVar73.x, nodeVar73.y, ( nodeVar71 - nodeVar72 ) ) * 0.006 ) ) + ( nodeVar36 * -0.004 ) ) * ( 1.0 - smoothstep( 0.05, 0.22, nodeVar54 ) ) );
	nodeVar75 = ( vec3<f32>( sign( NORMAL_nodeVar69 ) ) * ( ( vec3<f32>( dpdx( nodeVar74 ) ) * NORMAL_nodeVar68 ) + ( vec3<f32>( - dpdy( nodeVar74 ) ) * cross( NORMAL_normalView, nodeVar66 ) ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar69 ) ) * NORMAL_normalView ) - nodeVar75 ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar76 = ( NodeBuffer_11649.value[ 1u ].xyz - v_positionWorld );
	nodeVar77 = dot( nodeVar76, nodeVar76 );
	nodeVar78 = ( NodeBuffer_11649.value[ 2u ].xyz - v_positionWorld );
	nodeVar79 = dot( nodeVar78, nodeVar78 );
	nodeVar80 = ( NodeBuffer_11649.value[ 3u ].xyz - v_positionWorld );
	nodeVar81 = dot( nodeVar80, nodeVar80 );
	nodeVar82 = ( NodeBuffer_11649.value[ 4u ].xyz - v_positionWorld );
	nodeVar83 = dot( nodeVar82, nodeVar82 );
	nodeVar84 = ( NodeBuffer_11649.value[ 5u ].xyz - v_positionWorld );
	nodeVar85 = dot( nodeVar84, nodeVar84 );
	nodeVar86 = ( NodeBuffer_11649.value[ 6u ].xyz - v_positionWorld );
	nodeVar87 = dot( nodeVar86, nodeVar86 );
	EmissiveColor = ( nodeVar62 * ( ( ( ( ( ( ( vec3<f32>( 0.0, 0.0, 0.0 ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11649.value[ 0u ].w * ( 1.0 / ( 1.0 + ( nodeVar65 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar64 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar65 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 0.0 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 0.0 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11649.value[ 1u ].w * ( 1.0 / ( 1.0 + ( nodeVar77 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar76 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar77 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 2.13 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 2.13 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11649.value[ 2u ].w * ( 1.0 / ( 1.0 + ( nodeVar79 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar78 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar79 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 4.26 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 4.26 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11649.value[ 3u ].w * ( 1.0 / ( 1.0 + ( nodeVar81 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar80 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar81 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 6.39 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 6.39 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11649.value[ 4u ].w * ( 1.0 / ( 1.0 + ( nodeVar83 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar82 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar83 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 8.52 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 8.52 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11649.value[ 5u ].w * ( 1.0 / ( 1.0 + ( nodeVar85 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar84 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar85 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 10.649999999999999 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 10.649999999999999 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) + ( vec3<f32>( 1.0, 0.5, 0.17 ) * vec3<f32>( ( ( ( ( NodeBuffer_11649.value[ 6u ].w * ( 1.0 / ( 1.0 + ( nodeVar87 * 0.55 ) ) ) ) * ( ( clamp( dot( normalWorld, normalize( nodeVar86 ) ), 0.0, 1.0 ) * 0.8 ) + 0.2 ) ) * smoothstep( 1.0, 0.12, ( nodeVar87 / 64.0 ) ) ) * ( ( 0.88 + ( sin( ( ( render.nodeUniform8 * 11.0 ) + 12.78 ) ) * 0.07 ) ) + ( sin( ( ( render.nodeUniform8 * 5.3 ) + ( 12.78 * 1.9 ) ) ) * 0.05 ) ) ) ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar88 = dot( normalView, positionViewDirection );
	nodeVar89 = textureSample( nodeUniform9, nodeUniform9_sampler, vec2<f32>( Roughness, clamp( nodeVar88, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar89;
	nodeVar90 = ( dfg.x + dfg.y );
	nodeVar91 = ( 1.0 / nodeVar90 );
	nodeVar92 = nodeVar91;
	nodeVar93 = ( nodeVar92 - 1.0 );
	nodeVar94 = ( SpecularColorBlended * vec3<f32>( nodeVar93 ) );
	nodeVar95 = ( nodeVar94 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar95;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar96 = dot( normalWorld, normalize( render.nodeUniform12 ) );
	nodeVar97 = ( nodeVar96 * 0.5 );
	nodeVar98 = ( nodeVar97 + 0.5 );
	nodeVar99 = mix( render.nodeUniform10, render.nodeUniform11, nodeVar98 );
	nodeVar100 = ( irradiance + nodeVar99 );
	irradiance = nodeVar100;
	nodeVar101 = ( render.nodeUniform13 - render.nodeUniform14 );
	nodeVar102 = vec4<f32>( nodeVar101, 0.0 );
	nodeVar103 = ( render.cameraViewMatrix * nodeVar102 );
	nodeVar104 = normalize( nodeVar103.xyz );
	nodeVar105 = nodeVar104;
	nodeVar106 = dot( normalView, nodeVar105 );
	nodeVar107 = ( vec3<f32>( clamp( nodeVar106, 0.0, 1.0 ) ) * render.nodeUniform15 );
	nodeVar108 = nodeVar107;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar109 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar110 = ( nodeVar108 * nodeVar109 );
	nodeVar111 = ( nodeVar105 + positionViewDirection );
	nodeVar112 = normalize( nodeVar111 );
	nodeVar113 = dot( positionViewDirection, nodeVar112 );
	nodeVar114 = clamp( nodeVar113, 0.0, 1.0 );
	nodeVar115 = exp2( ( ( ( nodeVar114 * -5.55473 ) - 6.98316 ) * nodeVar114 ) );
	nodeVar116 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar115 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar115 ) ) );
	nodeVar117 = ( vec3<f32>( 1.0 ) - nodeVar116 );
	nodeVar118 = nodeVar117;
	nodeVar119 = ( nodeVar110 * nodeVar118 );
	nodeVar120 = ( directDiffuse + nodeVar119 );
	directDiffuse = nodeVar120;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar121 = normalize( ( nodeVar105 + positionViewDirection ) );
	nodeVar122 = clamp( dot( positionViewDirection, nodeVar121 ), 0.0, 1.0 );
	nodeVar123 = exp2( ( ( ( nodeVar122 * -5.55473 ) - 6.98316 ) * nodeVar122 ) );
	nodeVar124 = ( Roughness * Roughness );
	nodeVar125 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar123 ) ) ) + vec3<f32>( ( 1.0 * nodeVar123 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar124, clamp( dot( normalView, nodeVar105 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar124, clamp( dot( normalView, nodeVar121 ), 0.0, 1.0 ) ) ) );
	nodeVar126 = ( nodeVar108 * nodeVar125 );
	nodeVar127 = ( nodeVar126 * multiScatteringCompensation );
	nodeVar128 = ( directSpecular + nodeVar127 );
	directSpecular = nodeVar128;
	nodeVar129 = ( render.nodeUniform16 - render.nodeUniform17 );
	nodeVar130 = vec4<f32>( nodeVar129, 0.0 );
	nodeVar131 = ( render.cameraViewMatrix * nodeVar130 );
	nodeVar132 = normalize( nodeVar131.xyz );
	nodeVar133 = nodeVar132;
	nodeVar134 = dot( normalView, nodeVar133 );
	shadowPositionWorld = v_positionWorld;
	nodeVar136 = ( render.nodeUniform19 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform20 ) ) ), 1.0 ) );
	nodeVar137 = ( nodeVar136.xyz / vec3<f32>( nodeVar136.w ) );
	nodeVar138 = vec3<f32>( nodeVar137.x, ( 1.0 - nodeVar137.y ), ( nodeVar137.z + render.nodeUniform21 ) );

	if ( ( ( ( ( ( nodeVar138.x >= 0.0 ) && ( nodeVar138.x <= 1.0 ) ) && ( nodeVar138.y >= 0.0 ) ) && ( nodeVar138.y <= 1.0 ) ) && ( nodeVar138.z <= 1.0 ) ) ) {

		nodeVar139 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar140 = ( render.nodeUniform23 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform24 ).x );
		nodeVar141 = ( nodeVar138.xy + ( vogelDiskSample( 0, 5, nodeVar139 ) * vec2<f32>( nodeVar140 ) ) );
		nodeVar142 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar141, nodeVar138.z );
		nodeVar143 = ( nodeVar138.xy + ( vogelDiskSample( 1, 5, nodeVar139 ) * vec2<f32>( nodeVar140 ) ) );
		nodeVar144 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar143, nodeVar138.z );
		nodeVar145 = ( nodeVar138.xy + ( vogelDiskSample( 2, 5, nodeVar139 ) * vec2<f32>( nodeVar140 ) ) );
		nodeVar146 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar145, nodeVar138.z );
		nodeVar147 = ( nodeVar138.xy + ( vogelDiskSample( 3, 5, nodeVar139 ) * vec2<f32>( nodeVar140 ) ) );
		nodeVar148 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar147, nodeVar138.z );
		nodeVar149 = ( nodeVar138.xy + ( vogelDiskSample( 4, 5, nodeVar139 ) * vec2<f32>( nodeVar140 ) ) );
		nodeVar150 = textureSampleCompare( nodeUniform22, nodeUniform22_sampler, nodeVar149, nodeVar138.z );
		nodeVar135 = ( ( ( ( ( nodeVar142 + nodeVar144 ) + nodeVar146 ) + nodeVar148 ) + nodeVar150 ) * 0.2 );

	} else {

		nodeVar135 = 1.0;

	}

	nodeVar151 = mix( 1.0, nodeVar135, render.nodeUniform25 );
	nodeVar152 = ( vec3<f32>( clamp( nodeVar134, 0.0, 1.0 ) ) * ( render.nodeUniform18 * vec3<f32>( nodeVar151 ) ) );
	nodeVar153 = nodeVar152;
	nodeVar154 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar155 = ( nodeVar153 * nodeVar154 );
	nodeVar156 = ( nodeVar133 + positionViewDirection );
	nodeVar157 = normalize( nodeVar156 );
	nodeVar158 = dot( positionViewDirection, nodeVar157 );
	nodeVar159 = clamp( nodeVar158, 0.0, 1.0 );
	nodeVar160 = exp2( ( ( ( nodeVar159 * -5.55473 ) - 6.98316 ) * nodeVar159 ) );
	nodeVar161 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar160 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar160 ) ) );
	nodeVar162 = ( vec3<f32>( 1.0 ) - nodeVar161 );
	nodeVar163 = nodeVar162;
	nodeVar164 = ( nodeVar155 * nodeVar163 );
	nodeVar165 = ( directDiffuse + nodeVar164 );
	directDiffuse = nodeVar165;
	nodeVar166 = normalize( ( nodeVar133 + positionViewDirection ) );
	nodeVar167 = clamp( dot( positionViewDirection, nodeVar166 ), 0.0, 1.0 );
	nodeVar168 = exp2( ( ( ( nodeVar167 * -5.55473 ) - 6.98316 ) * nodeVar167 ) );
	nodeVar169 = ( Roughness * Roughness );
	nodeVar170 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar168 ) ) ) + vec3<f32>( ( 1.0 * nodeVar168 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar169, clamp( dot( normalView, nodeVar133 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar169, clamp( dot( normalView, nodeVar166 ), 0.0, 1.0 ) ) ) );
	nodeVar171 = ( nodeVar153 * nodeVar170 );
	nodeVar172 = ( nodeVar171 * multiScatteringCompensation );
	nodeVar173 = ( directSpecular + nodeVar172 );
	directSpecular = nodeVar173;
	nodeVar174 = ( render.nodeUniform26 - v_positionView );
	nodeVar175 = normalize( nodeVar174 );
	nodeVar176 = dot( normalView, nodeVar175 );

	if ( ( render.nodeUniform28 > 0.0 ) ) {

		nodeVar178 = length( nodeVar174 );
		nodeVar179 = ( nodeVar178 / render.nodeUniform28 );
		nodeVar180 = clamp( ( 1.0 - ( ( ( nodeVar179 * nodeVar179 ) * nodeVar179 ) * nodeVar179 ) ), 0.0, 1.0 );
		nodeVar177 = ( ( 1.0 / max( pow( nodeVar178, render.nodeUniform29 ), 0.01 ) ) * ( nodeVar180 * nodeVar180 ) );

	} else {

		nodeVar177 = ( 1.0 / max( pow( length( nodeVar174 ), render.nodeUniform29 ), 0.01 ) );

	}

	nodeVar181 = ( render.nodeUniform27 * vec3<f32>( nodeVar177 ) );
	nodeVar182 = ( vec3<f32>( clamp( nodeVar176, 0.0, 1.0 ) ) * nodeVar181 );
	nodeVar183 = nodeVar182;
	nodeVar184 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar185 = ( nodeVar183 * nodeVar184 );
	nodeVar186 = ( nodeVar175 + positionViewDirection );
	nodeVar187 = normalize( nodeVar186 );
	nodeVar188 = dot( positionViewDirection, nodeVar187 );
	nodeVar189 = clamp( nodeVar188, 0.0, 1.0 );
	nodeVar190 = exp2( ( ( ( nodeVar189 * -5.55473 ) - 6.98316 ) * nodeVar189 ) );
	nodeVar191 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar190 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar190 ) ) );
	nodeVar192 = ( vec3<f32>( 1.0 ) - nodeVar191 );
	nodeVar193 = nodeVar192;
	nodeVar194 = ( nodeVar185 * nodeVar193 );
	nodeVar195 = ( directDiffuse + nodeVar194 );
	directDiffuse = nodeVar195;
	nodeVar196 = normalize( ( nodeVar175 + positionViewDirection ) );
	nodeVar197 = clamp( dot( positionViewDirection, nodeVar196 ), 0.0, 1.0 );
	nodeVar198 = exp2( ( ( ( nodeVar197 * -5.55473 ) - 6.98316 ) * nodeVar197 ) );
	nodeVar199 = ( Roughness * Roughness );
	nodeVar200 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar198 ) ) ) + vec3<f32>( ( 1.0 * nodeVar198 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar199, clamp( dot( normalView, nodeVar175 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar199, clamp( dot( normalView, nodeVar196 ), 0.0, 1.0 ) ) ) );
	nodeVar201 = ( nodeVar183 * nodeVar200 );
	nodeVar202 = ( nodeVar201 * multiScatteringCompensation );
	nodeVar203 = ( directSpecular + nodeVar202 );
	directSpecular = nodeVar203;
	nodeVar204 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar205 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar206 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar207 = ( SpecularF90 * dfg.y );
	nodeVar208 = ( nodeVar206 + vec3<f32>( nodeVar207 ) );
	nodeVar209 = ( nodeVar204 + nodeVar208 );
	nodeVar204 = nodeVar209;
	nodeVar210 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar211 = nodeVar210;
	nodeVar212 = ( nodeVar211 * vec3<f32>( 0.047619 ) );
	nodeVar213 = ( SpecularColor + nodeVar212 );
	nodeVar214 = ( nodeVar208 * nodeVar213 );
	nodeVar215 = ( dfg.x + dfg.y );
	nodeVar216 = ( 1.0 - nodeVar215 );
	nodeVar217 = nodeVar216;
	nodeVar218 = ( vec3<f32>( nodeVar217 ) * nodeVar213 );
	nodeVar219 = ( vec3<f32>( 1.0 ) - nodeVar218 );
	nodeVar220 = nodeVar219;
	nodeVar221 = ( nodeVar214 / nodeVar220 );
	nodeVar222 = ( nodeVar221 * vec3<f32>( nodeVar217 ) );
	nodeVar223 = ( nodeVar205 + nodeVar222 );
	nodeVar205 = nodeVar223;
	nodeVar224 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar225 = ( irradiance * nodeVar224 );
	nodeVar226 = ( nodeVar204 + nodeVar205 );
	nodeVar227 = ( vec3<f32>( 1.0 ) - nodeVar226 );
	nodeVar228 = nodeVar227;
	nodeVar229 = ( nodeVar225 * nodeVar228 );
	nodeVar230 = nodeVar229;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar231 = ( indirectDiffuse + nodeVar230 );
	indirectDiffuse = nodeVar231;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar232 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar233 = ( SpecularF90 * dfg.y );
	nodeVar234 = ( nodeVar232 + vec3<f32>( nodeVar233 ) );
	nodeVar235 = ( singleScatteringDielectric + nodeVar234 );
	singleScatteringDielectric = nodeVar235;
	nodeVar236 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar237 = nodeVar236;
	nodeVar238 = ( nodeVar237 * vec3<f32>( 0.047619 ) );
	nodeVar239 = ( SpecularColor + nodeVar238 );
	nodeVar240 = ( nodeVar234 * nodeVar239 );
	nodeVar241 = ( dfg.x + dfg.y );
	nodeVar242 = ( 1.0 - nodeVar241 );
	nodeVar243 = nodeVar242;
	nodeVar244 = ( vec3<f32>( nodeVar243 ) * nodeVar239 );
	nodeVar245 = ( vec3<f32>( 1.0 ) - nodeVar244 );
	nodeVar246 = nodeVar245;
	nodeVar247 = ( nodeVar240 / nodeVar246 );
	nodeVar248 = ( nodeVar247 * vec3<f32>( nodeVar243 ) );
	nodeVar249 = ( multiScatteringDielectric + nodeVar248 );
	multiScatteringDielectric = nodeVar249;
	nodeVar250 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar251 = ( SpecularF90 * dfg.y );
	nodeVar252 = ( nodeVar250 + vec3<f32>( nodeVar251 ) );
	nodeVar253 = ( singleScatteringMetallic + nodeVar252 );
	singleScatteringMetallic = nodeVar253;
	nodeVar254 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar255 = nodeVar254;
	nodeVar256 = ( nodeVar255 * vec3<f32>( 0.047619 ) );
	nodeVar257 = ( DiffuseColor.xyz + nodeVar256 );
	nodeVar258 = ( nodeVar252 * nodeVar257 );
	nodeVar259 = ( dfg.x + dfg.y );
	nodeVar260 = ( 1.0 - nodeVar259 );
	nodeVar261 = nodeVar260;
	nodeVar262 = ( vec3<f32>( nodeVar261 ) * nodeVar257 );
	nodeVar263 = ( vec3<f32>( 1.0 ) - nodeVar262 );
	nodeVar264 = nodeVar263;
	nodeVar265 = ( nodeVar258 / nodeVar264 );
	nodeVar266 = ( nodeVar265 * vec3<f32>( nodeVar261 ) );
	nodeVar267 = ( multiScatteringMetallic + nodeVar266 );
	multiScatteringMetallic = nodeVar267;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar268 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar269 = ( radiance * nodeVar268 );
	nodeVar270 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar271 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar272 = ( nodeVar270 * nodeVar271 );
	nodeVar273 = ( nodeVar269 + nodeVar272 );
	nodeVar274 = nodeVar273;
	nodeVar275 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar276 = ( vec3<f32>( 1.0 ) - nodeVar275 );
	nodeVar277 = nodeVar276;
	nodeVar278 = ( DiffuseContribution * nodeVar277 );
	nodeVar279 = ( nodeVar278 * nodeVar271 );
	nodeVar280 = nodeVar279;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar281 = ( indirectSpecular + nodeVar274 );
	indirectSpecular = nodeVar281;
	nodeVar282 = ( indirectDiffuse + nodeVar280 );
	indirectDiffuse = nodeVar282;
	ambientOcclusion = 1.0;
	nodeVar283 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar283;
	nodeVar284 = dot( normalView, positionViewDirection );
	nodeVar285 = ( clamp( nodeVar284, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar286 = ( Roughness * -16.0 );
	nodeVar287 = ( 1.0 - nodeVar286 );
	nodeVar288 = nodeVar287;
	nodeVar289 = ( - nodeVar288 );
	nodeVar290 = exp2( nodeVar289 );
	nodeVar291 = pow( nodeVar285, nodeVar290 );
	nodeVar292 = ( 1.0 - nodeVar291 );
	nodeVar293 = nodeVar292;
	nodeVar294 = ( ambientOcclusion - nodeVar293 );
	nodeVar295 = ( indirectSpecular * vec3<f32>( clamp( nodeVar294, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar295;
	nodeVar296 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar296;
	nodeVar297 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar297;
	nodeVar298 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar298;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar299 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar300 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform30, object.nodeUniform31, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform33 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform34 * object.nodeUniform34 ) * nodeVar299 ) * nodeVar299 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar300;

	// result

	output.color = nodeVar300;

	return output;

}
